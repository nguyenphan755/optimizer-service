/**
 * Tiếng chuông khi tăng số bài nộp chờ duyệt.
 * File: Mixkit — `public/sounds/notify-bell.wav` (nguồn: mixkit-clear-announce-tones-2861.wav).
 * Trình duyệt có thể chặn autoplay cho đến khi người dùng đã tương tác trang.
 */
const NOTIFY_BELL_URL = "/sounds/notify-bell.wav";

export function playSubmissionBell(): void {
  try {
    const a = new Audio(NOTIFY_BELL_URL);
    a.volume = 1;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
