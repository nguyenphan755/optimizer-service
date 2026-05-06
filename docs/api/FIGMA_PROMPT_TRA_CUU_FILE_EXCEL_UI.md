# Prompt Figma — Tra cứu theo file Excel (Bulk lookup + Import demo)

Tài liệu mô tả **giao diện Web đã triển khai** cho luồng **Tra cứu theo file Excel**, kèm **yêu cầu layout**, **màu sắc**, **luồng import file demo**, và **gợi ý mở rộng** khi sau này team dev phụ trách module import/export đầy đủ. Designer có thể bám sát để Figma **khớp UI hiện tại**, đồng thời chừa chỗ cho bản nâng cấp.

---

## 1. Vị trí trong app

- Cùng trang với **Tra cứu đơn**: hai tab / nút chuyển mode phía trên:
  - **Tra cứu đơn** (active: blue-600)
  - **Tra cứu theo file Excel** (active khi chọn tab này)
- Nội dung khu vực này là **toàn bộ** block mô tả dưới đây (không trộn với ô search autocomplete của tra cứu đơn).

---

## 2. Cấu trúc khối (từ trên xuống)

1. **Card 1 — Upload & hướng dẫn** (`rounded-xl`, viền `slate-200`, nền trắng, `shadow-sm`, `p-5`)
2. **Card 2 — Kết quả** (chỉ hiện sau khi tra cứu thành công): toolbar thống kê + lọc + CSV + bảng dữ liệu

Khoảng cách dọc giữa hai card: `space-y-6` (24px).

---

## 3. Card “Tra cứu theo file Excel”

### 3.1 Tiêu đề & mô tả

- **H2:** `text-lg font-semibold text-gray-900` — *Tra cứu theo file Excel*
- **Đoạn hướng dẫn** `text-sm text-gray-600`:
  - Sheet **đầu tiên**
  - Tối đa **10.000** dòng dữ liệu (số có thể highlight `strong`)
  - Cột **bắt buộc:** **Material**
  - Cột **mô tả** tùy chọn — tra cứu **theo mã**; **gom distinct** mã (dòng trùng mã chỉ tra một lần)

### 3.2 Hàng nút & file

- Nút **Chọn file .xlsx**: nền **`slate-800`**, chữ trắng, `rounded-lg`, `hover:bg-slate-700` — phân biệt với nút primary blue ở bước sau (CTA “Tra cứu”).
- Input `file` ẩn; `accept=".xlsx,.xls"`.
- Sau khi chọn file: hiện **tên file** `text-sm text-gray-600`, truncate nếu dài.

### 3.3 Trạng thái

| Trạng thái | Giao diện |
|------------|-----------|
| **Lỗi đọc file** (quá 10k dòng, không có sheet, …) | Banner `bg-red-50 border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm` |
| **Đã parse OK** | Dòng: *Đã đọc X dòng → Y mã sau khi gom* + nút **Tra cứu hàng loạt** `bg-blue-600 text-white rounded-lg` (loading: *Đang tra cứu…*, `disabled` + opacity) |
| **Lỗi API** | Cùng style banner đỏ như lỗi file |

---

## 4. Card kết quả (sau tra cứu)

### 4.1 Thanh meta + lọc + xuất

- Viền `slate-200`, header vùng toolbar `border-b slate-100`, `px-4 py-3`, `flex-wrap`.

**Dòng 1 — Thống kê (text-sm gray-700):**  
*Gửi [requested] dòng → [distinct] mã · Tìm thấy [found] · Không có trong hệ thống [not_found]* — các số **strong**.

**Dòng 2 — Controls:**

| Control | Style / nội dung |
|---------|------------------|
| Label “Lọc” | `text-xs text-gray-500` |
| Select lọc nhanh | `border-gray-200 rounded-lg text-sm`: **Tất cả** \| **Chỉ mã không có trong HT** \| **Chỉ còn thiếu NM (bất kỳ)** |
| Label “Thiếu tại NM” | `text-xs text-gray-500` |
| Select NM | **Nền amber nhạt** `border-amber-200 bg-amber-50/80 max-w-[220px]` — danh sách nhà máy từ master (tên + mã), có option **— Tất cả NM (không lọc theo NM) —** |
| Nút **Xuất CSV (đang lọc)** | `border border-gray-300 rounded-lg text-sm`, hover `bg-gray-50` |

**Dòng 3 — Ghi chú (text-xs gray-500, full width):**  
Giải thích: lọc “Thiếu tại NM”; CSV **chỉ cột NM thiếu** (không cột NM đã có); khi chọn một NM thì mỗi dòng CSV **một tên NM**; **tốc độ trong CSV để trống** nếu còn NM thiếu; hiển thị **số dòng** đang xem sau lọc.

### 4.2 Bảng kết quả

- Vùng scroll: `overflow-x-auto`, chiều cao tối đa ~ `min(560px, 70vh)`.
- **Header bảng** sticky, `bg-slate-50`, `text-xs text-gray-500`, `shadow-sm`.

**Cột (theo thứ tự):**

| Cột | Ghi chú UI |
|-----|------------|
| Material | `font-mono text-xs` |
| Mô tả (file) | truncate `max-w` ~200px, `title` full text |
| Mô tả (HT) | không tìm thấy mã: chữ đỏ `text-red-600` |
| Công đoạn | Tên bước (Kéo/Xoắn/…) |
| NM có dữ liệu | List bullet `text-xs`, nhiều tên NM |
| NM thiếu | List bullet, `text-amber-900` — nhấn mạnh thiếu |
| Tốc độ tốt nhất | Số format locale |
| Điện trở (dòng) | `text-xs`; XOAN: số dòng hoặc thông báo; có thể kèm *(khóa từ mô tả file)* |

- Dòng: `hover:bg-slate-50/80`, `divide-y divide-gray-100`.
- **Không có dòng khớp lọc:** ô trống giữa `p-6 text-center text-gray-500`.

---

## 5. Màu & nhận diện (tóm tắt token)

| Vai trò | Token (Tailwind tham chiếu) |
|---------|-----------------------------|
| Viền card | `slate-200` |
| Nút chọn file | `slate-800` |
| CTA tra cứu / tab active | `blue-600` |
| Lọc theo NM thiếu | `amber-200` + `amber-50` |
| Cột NM thiếu (bảng) | `amber-900` |
| Lỗi | `red-50` / `red-200` / `red-700` |

---

## 6. File demo import (để designer / PO chuẩn bị mẫu)

**Phục vụ demo & test UI** — khớp code hiện tại:

- Định dạng: **.xlsx** (hoặc .xls)
- **Sheet đầu tiên** chứa dữ liệu
- Header: ít nhất cột **Material** (tên cột có thể *Material* hoặc chứa “material”, không trùng “description”)
- Tuỳ chọn: **Material description** (hoặc cột có chữ *description* / *mô tả*)
- Tối đa **10.000** dòng dữ liệu (không tính header)
- Dòng trùng **cùng mã** → hệ thống **gom 1 mã** (mô tả lấy lần đầu)

Designer có thể để **file mẫu đính kèm Figma** (hoặc link) để stakeholder thử cùng layout.

---

## 7. Luồng dữ liệu (để Figma không vẽ sai chức năng)

- **Parse file trong trình duyệt** — không upload nguyên file lên server trong bản hiện tại; chỉ gửi **danh sách mã** (JSON) lên API tra cứu hàng loạt.
- **Export CSV** là **tải xuống** từ client, nội dung theo **bộ lọc đang áp dụng** (xem quy tắc cột tốc độ / NM thiếu trong code).

---

## 8. Phạm vi sau này — Import / Export (giao dev phụ trách)

**Gợi ý cho Figma (không bắt buộc trong bản 1):**

- Có thể thêm **khu vực “Quản trị / Nhập dữ liệu”** tách tab hoặc trang riêng: upload log, lịch sử import, template tải về — để sau này dev implement **import/export** đầy đủ (server-side, phân quyền, audit).
- Màn **Tra cứu theo file Excel** hiện tại giữ vai trò **tra cứu nhanh + CSV**; không nhất thiết gộp ô upload master dữ liệu vào cùng card nếu làm rối user.

Ghi chú cho handoff: *“Module import/export mở rộng do dev phụ trách; màn bulk hiện chỉ import file demo tra cứu.”*

---

## 9. Đồng bộ layout với Capacity lookup

- Nếu team đã chốt **full width** / **container rộng** cho trang Tra cứu đơn, áp dụng **cùng grid padding** cho tab **Tra cứu theo file Excel** (cùng `max-width` / full-bleed).
- Bảng nhiều cột: trên màn nhỏ vẫn **scroll ngang** — thiết kế không cắt bớt cột.

---

## 10. Checklist giao Figma

- [ ] Tab **Tra cứu đơn** / **Tra cứu theo file Excel**
- [ ] Card hướng dẫn + nút **Chọn file .xlsx** (slate) + **Tra cứu hàng loạt** (blue)
- [ ] Trạng thái lỗi / đang tải / thống kê sau parse
- [ ] Card kết quả: meta + 2 select lọc + nút CSV + đoạn chú thích
- [ ] Bảng đủ 8 cột, sticky header, bullet NM có / NM thiếu
- [ ] Empty state “Không có dòng khớp bộ lọc”
- [ ] File demo mẫu hoặc mô tả cột trong specs
- [ ] (Tuỳ chọn) Frame “Future: import/export admin”

---

## 11. Liên kết tài liệu khác

- Tra cứu đơn (màu/component): `docs/FIGMA_PROMPT_TRA_CUU_DON_UI.md`
- Layout full width + 4 NM: `docs/FIGMA_PROMPT_CAPACITY_LOOKUP_LAYOUT_UNITS.md`
- Nghiệp vụ năng lực + điện trở: `docs/FIGMA_PROMPT_TRA_CUU_TOC_DO_VA_DIEN_TRO.md`

---

*Tài liệu phản ánh UI dev tại thời điểm tạo; khi thêm màn import/export, cập nhật mục 8 và checklist.*
