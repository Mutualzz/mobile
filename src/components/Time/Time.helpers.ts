import dayjs from "dayjs";

export const toShortRelative = (d: dayjs.Dayjs) => {
    const now = dayjs();
    const s = Math.abs(now.diff(d, "second"));

    if (s < 45) return "now";
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.round(h / 24);
    if (days < 7) return `${days}d`;
    const w = Math.round(days / 7);
    if (w < 5) return `${w}w`;
    const mo = Math.round(days / 30);
    if (mo < 12) return `${mo}mo`;
    const y = Math.round(days / 365);
    return `${y}y`;
};
