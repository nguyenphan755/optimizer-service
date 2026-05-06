# Prompt Figma — Giao diện tra cứu đơn (MES CADIVI)

Tài liệu mô tả **cấu trúc trang, màu sắc, typography và component** đang dùng trên app dev (React + Tailwind), để designer/code Figma **bám sát look & feel** khi làm mockup hoặc design system.  
**Phạm vi:** luồng **Tra cứu đơn** (không gồm chi tiết màn “Tra cứu theo file Excel” — có thể tham chiếu palette tương tự).

---

## 1. Nền & khung trang

| Token (ý nghĩa) | Giá trị tham chiếu (Tailwind) |
|-------------------|-------------------------------|
| Nền toàn trang | `bg-gray-50` |
| Vùng nội dung | `max-w-[1200px]` căn giữa, `px-6` `py-8` |
| Chữ mặc định | `text-gray-900`, `antialiased` |

---

## 2. Bảng màu chủ đạo (semantic)

| Vai trò | Màu | Ghi chú |
|--------|-----|---------|
| **Primary / CTA** | Blue 600 (`#2563eb` tương đương) | Nút active, chip chọn, viền ô search khi focus |
| **Primary nhạt** | Blue 50 | Không dùng nền lớn; gradient banner dùng blue-50 |
| **Thành công / có dữ liệu** | Green 600 (chữ), Green 100/700 (badge) | Chỉ số “nhà máy có dữ liệu”, badge “Đề xuất” |
| **Cảnh báo nhẹ** | Amber 50 / Amber 200 / Amber 900 | Lỗi điện trở, thông báo parse |
| **Khối phụ (điện trở)** | Violet 50 → trắng gradient, border violet 200 | Phân biệt khối “Điện trở đo” với banner năng lực |
| **Trung tính** | Gray 100–900 | Viền card, placeholder, text phụ |
| **Chip công đoạn** | Xem mục 8 | Mỗi bước một cặp pastel |

**Nguyên tắc:** nền sáng, **một accent chính (blue)** cho hành động; **green** cho trạng thái tích cực; **violet** chỉ cho module điện trở để không lẫn với banner xanh–lá.

---

## 3. Cấu trúc dọc trang (Tra cứu đơn)

1. **Hàng mode** (2 nút pill): `Tra cứu đơn` | `Tra cứu theo file Excel`  
   - Active: `bg-blue-600 text-white`  
   - Inactive: `bg-gray-100 text-gray-700`, hover `bg-gray-200`  
   - `rounded-lg`, `px-4 py-2`, `text-sm font-medium`

2. **Vùng sticky** (ô tìm kiếm): `sticky top-0 z-10`, nền `bg-white`, `shadow-sm`, padding dọc ~`py-5`, full width trong container (có offset `-mx-6 px-6` để full-bleed shadow).

3. **Thanh filter chip** (công đoạn): ngay dưới sticky.

4. **Empty state** (chưa chọn material): căn giữa, `min-h-[40vh]`, chữ xám `text-gray-400`, tiêu đề `text-lg` + mô tả `text-sm`.

5. **Sau khi chọn material:**  
   - Skeleton loading (placeholder xám pulse)  
   - **Banner tóm tắt năng lực** (gradient xanh–lá)  
   - **Panel điện trở** (chỉ XOAN) — violet  
   - **Lưới 3 cột** card nhà máy (desktop `md:grid-cols-3`)

---

## 4. Ô tìm kiếm (Search bar)

- Chiều cao cố định **52px**, bo góc **10px**, viền **1.5px** `gray-200`.  
- **Focus:** viền `blue-600` (focus-within).  
- Icon kính lúp bên trái, `text-gray-400`, `pl-11` cho input.  
- Placeholder `text-gray-400`; nội dung `text-gray-900`.  
- Bên phải: spinner `border-blue-600` khi loading, hoặc nút × xóa `text-gray-400` hover `gray-600`.

---

## 5. Dropdown gợi ý (autocomplete)

- Gắn ngay dưới ô search: `absolute`, `z-50`, nền trắng, viền `gray-200`, bo **10px**, đổ bóng `0 4px 16px rgba(0,0,0,0.10)`, `max-h` ~360px scroll.  
- Skeleton dòng: `h-14`, `bg-gray-100`, `animate-pulse`, bo `lg`, margin ngang.  
- Mỗi option: mã **font-mono đậm**, mô tả + chip công đoạn; trạng thái hover/active có nền nhạt (theo implementation).

---

## 6. Filter chips (công đoạn)

- Dạng **pill**: `rounded-full`, `px-3 py-1`, `text-sm`, `border`.  
- **Chọn:** `bg-blue-600 text-white border-transparent`.  
- **Chưa chọn:** `bg-gray-100 text-gray-600 border-gray-200`, hover `bg-gray-200`.

---

## 7. Banner tóm tắt năng lực (hero card)

- Nền **gradient** `from-blue-50 to-green-50`, viền `blue-200`, `rounded-xl`, `p-5`, `mb-6`.  
- Hàng 1: mã **font-mono bold** + mô tả thường + **ProcessChip** công đoạn (góc phải).  
- Hàng 2: **grid 3 cột** (mobile 1 cột):  
  - Nhãn: `text-xs text-gray-500`  
  - Số lớn: `text-2xl font-bold` (tốc độ, sản lượng)  
  - Phụ: `text-sm text-gray-500`  
- Hàng 3: **●** `text-green-600` + số NM có dữ liệu; **○** `text-gray-400` + số NM chưa có.

---

## 8. Chip công đoạn (màu cố định theo bước)

| Code | Nền | Chữ | Nhãn |
|------|-----|-----|------|
| KEO | blue-100 | blue-700 | Kéo |
| XOAN | purple-100 | purple-700 | Xoắn |
| GIAP | amber-100 | amber-700 | Giáp |
| BOC | green-100 | green-700 | Bọc |
| Khác | gray-100 | gray-700 | mã code |

Dạng: `rounded-full`, `px-2 py-0.5`, `text-xs font-medium` (size md).

---

## 9. Card nhà máy (có dữ liệu)

- Nền trắng, `border gray-200`, `rounded-xl`, `shadow-sm`.  
- Header: `border-b gray-100`, tên NM `font-semibold`, badge **Đề xuất** nhà máy: `bg-green-100 text-green-700`, `text-xs`, pill.  
- **Dòng máy:**  
  - Máy được recommend: nền `green-50`; có sao vàng ★, badge “Đề xuất” `bg-green-500 text-white` nhỏ.  
  - Nhãn cột TK/TT/Sản lượng: `text-xs text-gray-400`.

---

## 10. Card nhà máy (không có dữ liệu)

- Nền `gray-50`, viền **nét đứt** `border-dashed gray-200`, `rounded-xl`, `min-h` ~160px, căn giữa nội dung.  
- Icon cylinder/minimal `text-gray-300`.  
- Nút CTA báo thiếu: `text-xs`, `text-blue-600`, viền `blue-200`, hover `bg-blue-50`.

---

## 11. Panel điện trở (XOAN)

- Viền `violet-200`, gradient `from-violet-50 to-white`, `rounded-xl`.  
- Header: tiêu đề `font-semibold`, phụ đề khóa tra cứu `text-xs text-gray-500`.  
- Thanh “Cập nhật mới nhất”: `bg-violet-100/60`, chữ `violet-900`.  
- Bảng: header sticky, `text-xs text-gray-500`; số điện trở `font-mono text-xs`; hover dòng `violet-50/40`.  
- Loading: khối `border-violet-200`, `bg-violet-50/50`, pulse.  
- Lỗi / parse: `border-amber-200`, `bg-amber-50`, `text-amber-900`.

---

## 12. Skeleton loading (đang tải năng lực)

- Một thanh ngang `h-28` + grid 3 ô `h-48`, `bg-gray-100`, `rounded-xl`, `animate-pulse`.

---

## 13. Lỗi chung

- `border-red-200`, `bg-red-50`, `text-red-800`, `rounded-xl`, `p-4`.

---

## 14. Gợi ý cho Figma

1. Tạo **color styles**: Primary, Success, Warning, Neutral, **Violet** (module điện trở), **Process* (4 bước).  
2. **Text styles**: Title / Body / Caption / Mono (mã material).  
3. **Effects**: shadow nhẹ cho dropdown + card; không dùng shadow nặng trên toàn trang.  
4. **Grid**: 12 cột hoặc max-width 1200px, breakpoint `md` ≈ 768px cho 3 cột card.  
5. Giữ **độ tương phản** nhãn phụ (gray-500) vs số liệu (đậm) như hiện tại.  
6. Khi **code lại** theo design: không đổi luồng UX (chọn từ gợi ý, chip công đoạn, XOAN mới có điện trở) — chỉ điều chỉnh visual.

---

## 15. Liên kết tài liệu khác

- Tra cứu năng lực + điện trở (nội dung/nghiệp vụ): `docs/FIGMA_PROMPT_TRA_CUU_TOC_DO_VA_DIEN_TRO.md`  
- Phần **Tra cứu theo file Excel** dùng thêm **slate** + **amber** cho lọc NM — có thể thống nhất palette sau nếu muốn một design system.

---

*Tài liệu phản ánh implementation tại thời điểm tạo; class Tailwind mang tính tham chiếu (hex tương đương có thể lấy từ bảng Tailwind mặc định).*
