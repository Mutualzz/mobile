/**
 * 3D isometric Minecraft head (left-facing), Steve fallback if no skin.
 * @see https://mc-heads.net/head/{uuid}/left
 */
export const minecraftAvatarUrl = (uuid: string): string => {
  const id = uuid.trim().toLowerCase();
  return `https://mc-heads.net/head/${id}/left`;
};
