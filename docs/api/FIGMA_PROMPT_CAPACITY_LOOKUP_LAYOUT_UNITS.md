# Prompt Figma — Capacity lookup: full width, 4 NM / hàng, nhãn & đơn vị

Gửi kèm màn **Tra cứu đơn** (Capacity lookup) đã chỉnh lần 1. Bản này bổ sung **bắt buộc layout** và **chuẩn hiển thị số liệu** để dev code khớp và không còn “cô đọng” giữa màn hình.

---

## 1. Chiều ngang — bung tối đa

| Yêu cầu | Chi tiết |
|--------|----------|
| **Không** giữ khung hẹp kiểu `max-width ~1200px` canh giữa với margin hai bên quá lớn trên desktop. |
| **Ưu tiên:** full-bleed theo viewport (hoặc `max-width` rất lớn, ví dụ ≥ **1440–1600px**, padding ngang cố định **24–32px**). |
| Nội dung chính (search + banner + card NM) **dùng hết chiều ngang khả dụng** trong vùng an toàn (trừ padding trang). |
| Sticky search có thể full width; **grid card nhà máy** căn theo cùng container với banner tóm tắt. |

**Mục tiêu:** trên màn Full HD, không cảm giác “cột giữa nhỏ, hai bên trống quá nhiều”.

---

## 2. Lưới nhà máy — **4 cột cố định một hàng**

| Yêu cầu | Chi tiết |
|--------|----------|
| Với **đúng 4 nhà máy** trong dataset: **cả 4 card nằm trên một hàng** (một row). |
| **Không** để layout `grid-cols-3` khiến NM thứ 4 xuống hàng. |
| Breakpoint gợi ý: từ **lg/xl** trở lên dùng **`grid-template-columns: repeat(4, minmax(0, 1fr))`** (hoặc tương đương Auto layout 4 cột đều nhau). |
| Card NM: **min-width 0**, **equal width**, gap 16px (hoặc token spacing trong DS). |
| Chỉ xuống **< 4 cột / hàng** khi viewport hẹp (tablet/mobile) — không áp dụng “3+1” trên desktop rộng. |

**Kiểm tra:** zoom 100% trên 1920×1080 — 4 NM phải cùng một baseline hàng ngang.

---

## 3. Nhãn chỉ số — viết đầy đủ, không tắt

Trong từng **sub-card máy** (dòng máy trong nhà máy):

| Cũ (tránh) | Mới (bắt buộc) |
|------------|------------------|
| TK | **Thiết kế** (hoặc “Tốc độ thiết kế” nếu cần rõ hơn — thống nhất 1 cách trong toàn app) |
| TT | **Thực tế** (hoặc “Tốc độ thực tế”) |
| Sản lượng | Giữ **Sản lượng** (đã đủ); có thể thêm dòng phụ nếu có 2 đơn vị |

- Typography nhãn: `text-xs` / secondary color (gray-500), **không** chỉ 2 chữ cái nếu đã quyết định đi full label.

---

## 4. Đơn vị — luôn hiển thị cạnh số

| Trường | Quy tắc |
|--------|--------|
| Tốc độ thiết kế / thực tế | Mỗi giá trị phải có **đơn vị** ngay sau số (không để “18” trơn). Ví dụ: **`18 m/min`**, **`15 m/s`** — **thống nhất một đơn vị** theo công đoạn (dev map từ API: Kéo/Xoắn có thể khác; design ghi rõ ví dụ cho từng loại). |
| Sản lượng | Hiển thị đủ, ví dụ **`15.000 kg/ca`**, hoặc **`X km/ca` + `Y kg/ca`** nếu có 2 dòng — **luôn có đơn vị**, không chỉ số không. |

**Không chấp nhận:** một cột chỉ là số không chữ (trừ khi prototype placeholder, nhưng file handoff phải có unit).

---

## 5. Nhất quán với design hiện tại

- Giữ **bo góc**, **đổ bóng nhẹ**, **màu** (blue primary, green đề xuất, vàng cảnh báo điện trở) như bản đã duyệt.  
- Banner tóm tắt + chip Xoắn + card NM: **cùng hệ grid/padding** sau khi mở rộng full width.  
- Empty state NM (nét đứt, “Chưa có dữ liệu”, nút báo thiếu): giữ style, chỉ đảm bảo **chiều rộng card** khớp 4 cột.

---

## 6. Giao cho dev (annotation trên Figma)

- Ghi frame: **“Desktop ≥ 1280/1440: 4 cột NM, 1 hàng”**.  
- Spec: gap, padding container, `min()` / `1fr` nếu cần.  
- Bảng nhỏ trong card máy: map rõ **label đầy đủ + unit** cho từng ô.

---

## 7. Liên kết tài liệu cũ

- Giao diện tra cứu đơn (màu/component): `docs/FIGMA_PROMPT_TRA_CUU_DON_UI.md`  
- Nghiệp vụ năng lực + điện trở: `docs/FIGMA_PROMPT_TRA_CUU_TOC_DO_VA_DIEN_TRO.md`

---

*Tài liệu bổ sung cho vòng chỉnh layout + copy số liệu; không thay đổi luồng nghiệp vụ (chọn material, gợi ý, XOAN + điện trở).*
