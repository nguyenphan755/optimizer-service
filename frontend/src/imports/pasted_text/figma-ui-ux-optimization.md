Prompt cho Figma AI – Tối ưu tất cả giao diện dữ liệu & truy cập chi tiết
Tôi đã có sẵn bộ màn hình chức năng cho một web app nội bộ (quản lý năng lực sản xuất, Master Data, Missing Data, Upload Excel, Dashboard, v.v.).
Nguyên lý hệ thống đã ổn, giờ tôi cần bạn tối ưu UI/UX trong Figma theo các tiêu chí sau:

1. Mục tiêu tối ưu
Giảm tối đa việc phải kéo chuột quá nhiều (vertical scroll dài, horizontal scroll bảng).

Tăng khả năng nhìn nhanh, đọc nhanh dữ liệu chính trên một màn hình.

Hỗ trợ drill‑down chi tiết (xem sâu hơn một order, một nhà máy, một máy, một batch upload…) mà không cần chuyển sang trang mới hoàn toàn, ưu tiên:

Side panel (drawer bên phải).

Modal vừa phải.

Expandable row trong bảng.

Cấu trúc lại layout theo kiểu dashboard dữ liệu dày (data‑dense) nhưng vẫn gọn, sạch, không rối mắt.

2. Bối cảnh các màn hình chính
Các loại màn hình cần tối ưu:

Trang Tra cứu năng lực (search & result).

Trang Master Data (bảng dữ liệu lớn).

Trang Missing Data / Thiếu dữ liệu (bảng + filter + empty state).

Trang Upload & Duyệt Excel (danh sách batch + chi tiết + trạng thái).

Trang Dashboard & Insight (chart + bảng).

Tất cả đều là layout dạng desktop web, chỉ cần tối ưu cho độ phân giải từ 1440px trở lên trước, responsive có thể xử lý sau.

3. Nguyên tắc layout cần áp dụng
Hãy xem lại toàn bộ các frame và:

Sử dụng layout grid và spacing chuẩn cho analytics/dashboard:

Grid 12 cột, gutter hợp lý, margin 24–32px.

Scale spacing 4/8.

Card/panel có padding nhất quán.

Thiết kế lại header + filter bar + content theo pattern:

Trên cùng: Page header ngắn gọn (title + action chính).

Ngay dưới: Filter bar/các control chính (search, filter, switch view).

Bên dưới: Content (bảng/charts/panels) chia khu, hạn chế content quá dài một cột -> chia 2 cột khi hợp lý.

Áp dụng sticky elements để giảm scroll:

Sticky top nav / page header.

Sticky filter bar cho các màn màn hình nhiều filter.

Sticky header bảng (table header).

Với prototype, set behavior scroll & preserve scroll position hợp lý.

Ưu tiên nhiều panel đồng mức thay vì một danh sách quá dài:

Tách nội dung thành card/panel có chiều cao giới hạn với scroll nội bộ nếu cần.

Ví dụ: bên trái bảng tổng, bên phải detail/summary, thay vì stacking dọc quá nhiều.

4. Tối ưu bảng dữ liệu & drill‑down
Hãy chuẩn hóa tất cả bảng dữ liệu (Master Data, Missing Data, Upload Batch, Order list…) theo các nguyên tắc:

Bảng có:

Header rõ, sticky.

Hàng (row) với icon/trigger mở chi tiết (chevron, “…” menu).

Hỗ trợ sort, filter cơ bản, pagination.

Thiết kế drill‑down chi tiết theo các pattern:

Khi click 1 row, mở side drawer bên phải với:

Thông tin chi tiết order/material/nhà máy.

Tabs nếu cần: “Thông tin chung”, “Lịch sử upload”, “Năng lực tại các nhà máy khác”, …

Không bắt buộc chuyển sang màn hình “Detail page” mới trừ khi dữ liệu quá lớn.

Với các bảng có nhiều cột, ưu tiên:

Column pin (cố định 1–2 cột quan trọng).

Collapse bớt cột ít dùng vào “more info” trong drawer.

Giảm horizontal scroll:

Gom nhóm cột liên quan, dùng grouping hoặc column nesting trực quan.

Che bớt cột bằng toggle “Show more columns” hoặc hiển thị trong side drawer.

Sử dụng table card:

Mỗi bảng nằm trong 1 card có:

Title + filter mini + actions (export, column setting).

Body là table scrollable.

Footer là pagination.

5. Tối ưu truy cập vào mục chi tiết đang hiển thị
Mục tiêu: từ bất kỳ màn nào, user có thể “đi sâu” (drill‑down) một đối tượng (Order, Material, Plant, Machine, Upload Batch) trong 1–2 thao tác, không phải kéo nhiều.

Thêm interaction affordance trực quan:

Icon link / chevron / context menu ở từng row.

Hover state rõ ràng cho row clickable.

Đề xuất pattern thống nhất:

Click row → mở side drawer (chi tiết).

Click icon “Mở toàn màn hình” trong drawer → sang trang detail full page (nếu cần).

Với dashboard:

Click trên chart bar/segment → filter bảng bên dưới hoặc mở mini panel detail.

Sử dụng drilldown pattern tiêu chuẩn cho dashboard (card → chi tiết).

6. Giảm thao tác scroll và di chuyển
Hãy tối ưu để:

Một user có thể:

Vừa xem bảng tổng (ví dụ: Missing Data)

Vừa xem chi tiết một item
Trên cùng một màn hình, chỉ cần scroll rất ít.

Áp dụng:

Chia màn thành 2–3 cột hợp lý (ví dụ: 70/30 cho bảng và detail).

Dùng sections với tiêu đề rõ, tránh một cột đơn dài từ trên xuống dưới.

Giới hạn chiều cao tối đa của một số block (chart, list phụ), cho chúng scroll nội bộ khi cần.

Cấu hình prototype:

Frame chính: vertical scroll.

Table body: scroll riêng với sticky header.

Sidebar & header: fixed khi scroll.

7. Chuẩn hóa design system
Hãy chỉnh lại toàn bộ để:

Sử dụng một bộ typography scale (heading, subheading, table header, body, caption).

Sử dụng một bộ color token cho:

Status (success, warning, error, info).

Tags (Đề xuất, Thiếu data, Hoàn tất…).

Các component dùng Auto Layout, đặt trong library:

Page header.

Filter bar.

Table card.

Side drawer.

Tag/badge trạng thái.

Pagination.

Mục tiêu: các màn hình khác nhau nhìn nhất quán, đọc được logic, dễ cho dev chuyển sang React component