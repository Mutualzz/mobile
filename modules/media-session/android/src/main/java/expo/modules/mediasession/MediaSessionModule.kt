package expo.modules.mediasession

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import kotlin.math.abs
import kotlin.math.min

private const val MEDIA_CHANGED_EVENT = "onMediaChanged"
private const val SEEK_THRESHOLD_MS = 2000.0
private const val ARTWORK_SIZE = 128
private const val ARTWORK_QUALITY = 85
private val IDENTITY_KEYS = listOf("packageName", "title", "artist", "album", "durationMs")

class MediaSessionModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val watchedControllers = mutableListOf<MediaController>()
  private var lastSnapshot: Map<String, Any>? = null
  private var isWatching = false

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  private val listenerComponent: ComponentName
    get() = ComponentName(context, MediaNotificationListener::class.java)

  private val sessionManager: MediaSessionManager
    get() = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager

  private val controllerCallback = object : MediaController.Callback() {
    override fun onPlaybackStateChanged(state: PlaybackState?) = emitIfChanged()

    override fun onMetadataChanged(metadata: MediaMetadata?) = emitIfChanged()

    override fun onSessionDestroyed() = refreshControllers()
  }

  private val sessionsChangedListener =
    MediaSessionManager.OnActiveSessionsChangedListener { refreshControllers() }

  override fun definition() = ModuleDefinition {
    Name("MediaSession")

    Events(MEDIA_CHANGED_EVENT)

    Function("isAccessGranted") {
      isAccessGranted()
    }

    Function("openAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("getCurrentMedia") {
      currentSnapshot()
    }

    AsyncFunction("getArtwork") { trackKey: String ->
      artworkFor(trackKey)
    }

    Function("startWatching") {
      mainHandler.post { startWatching() }
      Unit
    }

    Function("stopWatching") {
      mainHandler.post { stopWatching() }
      Unit
    }

    OnDestroy {
      mainHandler.post { stopWatching() }
    }
  }

  private fun isAccessGranted(): Boolean {
    val enabledListeners = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners"
    ) ?: return false

    return enabledListeners.split(":").any { flattenedName ->
      ComponentName.unflattenFromString(flattenedName) == listenerComponent
    }
  }

  private fun activeControllers(): List<MediaController> {
    if (!isAccessGranted()) return emptyList()

    return try {
      sessionManager.getActiveSessions(listenerComponent)
    } catch (error: SecurityException) {
      emptyList()
    }
  }

  private fun playingController(): MediaController? =
    activeControllers().firstOrNull { controller ->
      controller.playbackState?.state == PlaybackState.STATE_PLAYING
    }

  private fun currentSnapshot(): Map<String, Any>? {
    val controller = playingController() ?: return null
    return snapshotOf(controller)
  }

  private fun trackKeyOf(controller: MediaController, metadata: MediaMetadata): String =
    listOf(
      controller.packageName,
      metadata.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "",
      metadata.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: "",
      metadata.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: ""
    ).joinToString("|")

  private fun artworkFor(trackKey: String): String? {
    val controller = playingController() ?: return null
    val metadata = controller.metadata ?: return null
    if (trackKeyOf(controller, metadata) != trackKey) return null

    val source = artworkBitmapOf(metadata) ?: return null
    return encodeArtwork(source)
  }

  private fun artworkBitmapOf(metadata: MediaMetadata): Bitmap? {
    val embeddedBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
      ?: metadata.getBitmap(MediaMetadata.METADATA_KEY_ART)
      ?: metadata.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
    if (embeddedBitmap != null) return embeddedBitmap

    val artworkUri = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)
      ?: metadata.getString(MediaMetadata.METADATA_KEY_ART_URI)
      ?: metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI)
      ?: return null

    return try {
      context.contentResolver.openInputStream(Uri.parse(artworkUri))?.use { stream ->
        BitmapFactory.decodeStream(stream)
      }
    } catch (error: Exception) {
      null
    }
  }

  private fun encodeArtwork(source: Bitmap): String? {
    return try {
      val softwareBitmap =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
          source.config == Bitmap.Config.HARDWARE
        ) {
          source.copy(Bitmap.Config.ARGB_8888, false)
        } else {
          source
        }

      val side = min(softwareBitmap.width, softwareBitmap.height)
      if (side <= 0) return null

      val squareBitmap = Bitmap.createBitmap(
        softwareBitmap,
        (softwareBitmap.width - side) / 2,
        (softwareBitmap.height - side) / 2,
        side,
        side
      )
      val scaledBitmap = Bitmap.createScaledBitmap(squareBitmap, ARTWORK_SIZE, ARTWORK_SIZE, true)

      val output = ByteArrayOutputStream()
      scaledBitmap.compress(Bitmap.CompressFormat.JPEG, ARTWORK_QUALITY, output)
      Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    } catch (error: Exception) {
      null
    }
  }

  private fun snapshotOf(controller: MediaController): Map<String, Any>? {
    val metadata = controller.metadata ?: return null
    val playbackState = controller.playbackState ?: return null
    val title = metadata.getString(MediaMetadata.METADATA_KEY_TITLE)
      ?.takeIf { value -> value.isNotBlank() } ?: return null
    val durationMs = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION).coerceAtLeast(0L)
    val positionMs = currentPositionMs(playbackState)

    return mapOf(
      "trackKey" to trackKeyOf(controller, metadata),
      "packageName" to controller.packageName,
      "title" to title,
      "artist" to (metadata.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: ""),
      "album" to (metadata.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: ""),
      "durationMs" to durationMs.toDouble(),
      "positionMs" to positionMs.toDouble(),
      "startedAt" to (System.currentTimeMillis() - positionMs).toDouble()
    )
  }

  private fun currentPositionMs(playbackState: PlaybackState): Long {
    val position = playbackState.position
    if (position == PlaybackState.PLAYBACK_POSITION_UNKNOWN) return 0L

    val lastUpdate = playbackState.lastPositionUpdateTime
    if (lastUpdate <= 0L) return position.coerceAtLeast(0L)

    val elapsedSinceUpdate = SystemClock.elapsedRealtime() - lastUpdate
    val advancedPosition = position + elapsedSinceUpdate * playbackState.playbackSpeed
    return advancedPosition.toLong().coerceAtLeast(0L)
  }

  private fun startWatching() {
    if (isWatching || !isAccessGranted()) return

    try {
      sessionManager.addOnActiveSessionsChangedListener(
        sessionsChangedListener,
        listenerComponent,
        mainHandler
      )
    } catch (error: SecurityException) {
      return
    }

    isWatching = true
    refreshControllers()
  }

  private fun stopWatching() {
    if (!isWatching) return

    sessionManager.removeOnActiveSessionsChangedListener(sessionsChangedListener)
    unregisterControllers()
    lastSnapshot = null
    isWatching = false
  }

  private fun unregisterControllers() {
    watchedControllers.forEach { controller ->
      controller.unregisterCallback(controllerCallback)
    }
    watchedControllers.clear()
  }

  private fun refreshControllers() {
    if (!isWatching) return

    unregisterControllers()
    activeControllers().forEach { controller ->
      controller.registerCallback(controllerCallback, mainHandler)
      watchedControllers.add(controller)
    }
    emitIfChanged()
  }

  private fun emitIfChanged() {
    if (!isWatching) return

    val snapshot = currentSnapshot()
    if (!hasMeaningfulChange(lastSnapshot, snapshot)) return

    lastSnapshot = snapshot
    sendEvent(MEDIA_CHANGED_EVENT, mapOf("media" to snapshot))
  }

  private fun hasMeaningfulChange(
    previous: Map<String, Any>?,
    next: Map<String, Any>?
  ): Boolean {
    if (previous == null || next == null) return previous != next
    if (IDENTITY_KEYS.any { key -> previous[key] != next[key] }) return true

    val previousStart = previous["startedAt"] as Double
    val nextStart = next["startedAt"] as Double
    return abs(previousStart - nextStart) > SEEK_THRESHOLD_MS
  }
}
