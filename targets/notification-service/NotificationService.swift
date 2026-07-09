import Intents
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent =
      (request.content.mutableCopy() as? UNMutableNotificationContent)

    guard let bestAttemptContent = bestAttemptContent else {
      contentHandler(request.content)
      return
    }

    let userInfo = request.content.userInfo
    let senderId = stringValue(userInfo, keys: "senderId")
    let senderName = stringValue(userInfo, keys: "senderName") ?? bestAttemptContent.title
    let conversationId = stringValue(userInfo, keys: "conversationId", "channelId")
    let avatarUrl =
      stringValue(userInfo, keys: "authorAvatarUrl")
      ?? richContentImageUrl(userInfo)

    guard let senderId, let conversationId, !senderName.isEmpty else {
      contentHandler(bestAttemptContent)
      return
    }

    let avatarImage = avatarUrl.flatMap { downloadAvatarImage(from: $0) }

    let sender = INPerson(
      personHandle: INPersonHandle(value: senderId, type: .unknown),
      nameComponents: nil,
      displayName: senderName,
      image: avatarImage,
      contactIdentifier: nil,
      customIdentifier: senderId
    )

    let intent = INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: bestAttemptContent.body,
      speakableGroupName: nil,
      conversationIdentifier: conversationId,
      serviceName: "Mutualzz",
      sender: sender,
      attachments: nil
    )

    let interaction = INInteraction(intent: intent, response: nil)
    interaction.direction = .incoming
    interaction.donate(completion: nil)

    do {
      let updated = try bestAttemptContent.updating(from: intent)
      contentHandler(updated)
    } catch {
      contentHandler(bestAttemptContent)
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let contentHandler = contentHandler,
      let bestAttemptContent = bestAttemptContent
    {
      contentHandler(bestAttemptContent)
    }
  }

  private func stringValue(
    _ userInfo: [AnyHashable: Any],
    keys: String...
  ) -> String? {
    for key in keys {
      if let value = userInfo[key] as? String, !value.isEmpty {
        return value
      }

      if let body = userInfo["body"] as? [String: Any],
        let value = body[key] as? String,
        !value.isEmpty
      {
        return value
      }
    }

    return nil
  }

  private func richContentImageUrl(_ userInfo: [AnyHashable: Any]) -> String? {
    if let body = userInfo["body"] as? [String: Any],
      let richContent = body["_richContent"] as? [String: Any],
      let image = richContent["image"] as? String,
      !image.isEmpty
    {
      return image
    }

    return nil
  }

  private func downloadAvatarImage(from urlString: String) -> INImage? {
    guard let url = URL(string: urlString) else { return nil }

    var request = URLRequest(url: url)
    request.timeoutInterval = 5

    var imageData: Data?
    let semaphore = DispatchSemaphore(value: 0)

    let task = URLSession.shared.dataTask(with: request) { data, response, _ in
      if let data = data,
        let httpResponse = response as? HTTPURLResponse,
        httpResponse.statusCode == 200
      {
        imageData = data
      }
      semaphore.signal()
    }
    task.resume()
    semaphore.wait()

    guard let imageData = imageData else { return nil }
    return INImage(imageData: imageData)
  }
}
