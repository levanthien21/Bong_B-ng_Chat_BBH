# Botbanhang AI Auto-Testing Studio & DeepSeek Evaluation Lab

Hệ thống kiểm thử AI Chatbot chuyên sâu theo phong cách **Claude Design** với giao diện **nhúng bong bóng chat vào trung tâm màn hình** (giải phóng hoàn toàn không gian phía trên), tích hợp **Cơ chế hỏi tuần tự khi AI trả lời xong**, hệ thống **2 File Huấn luyện (Kiến thức Sản phẩm + Quy tắc Prompt)** và **Liên kết DeepSeek API**.

---

## 🌟 Các nâng cấp cốt lõi mới hoàn thiện

### 1. Giải phóng hoàn toàn phía trên — Khung chat trung tâm chuyên nghiệp nhất
- **Loại bỏ toàn bộ thanh công cụ chật chội phía trên khung chat**: Chuyển các nút điều khiển ("Phiên khách mới", "Trạng thái SDK", "Thu phóng Zoom 100%/90%/80%") lên thanh Header chính và HUD nổi tinh tế ở đáy.
- **Không gian trung tâm thông thoáng 100%**: Vùng hiển thị trung tâm (`.stage-canvas-area`) dành trọn vẹn cho khung chat `Bongbongchat.vn`, chiều cao mở rộng tự nhiên `height: min(620px, calc(100% - 24px))`, đảm bảo thanh tiêu đề, lịch sử tin nhắn và **toàn bộ ô nhập liệu bên dưới luôn hiển thị trọn vẹn, không bao giờ bị che khuất**.

### 2. Vòng chạy Auto-QA Tuần tự (Chỉ hỏi khi AI đã trả lời xong)
- **Khắc phục tình trạng gửi dồn dập khiến AI không kịp trả lời**:
  - Khi gửi câu hỏi (ví dụ câu #1), hệ thống chuyển sang trạng thái:
    `⏳ Đang đợi AI trong bong bóng chat trả lời xong...`
  - Tích hợp 3 chế độ kiểm soát tốc độ:
    - ⚡ **Tự động thông minh (Adaptive Wait)**: Đếm ngược thời gian thích ứng (10s–15s cho AI stream xong chữ) hoặc nhận tín hiệu xác nhận.
    - 🎯 **Từng câu (Step-by-Step)**: Người dùng bấm phím `Space` hoặc nút **"✅ AI Đã Trả Lời Xong ➔ Chấm Điểm & Tiếp tục"** ngay khi bot vừa ngừng gõ.
    - ⏱️ **Thời gian cố định**: Tự động chuyển sau số giây bạn cấu hình.
  - Sau khi ghi nhận phản hồi và chấm điểm, hệ thống tự động **nghỉ 2.5 giây tự nhiên** (mô phỏng khách hàng đọc câu trả lời) rồi mới gửi câu hỏi tiếp theo.

### 3. Hệ thống 2 File Huấn luyện (Dual-File Training System)
Hệ thống quản lý độc lập 2 tài liệu chuẩn:
- **File 1 — Kiến thức Sản phẩm & Dịch vụ (`Product Knowledge & Q&A`)**:
  - Chứa thông tin sản phẩm, bảng giá phòng, các mức ưu đãi (5 đêm giảm 10%, 3 phòng giảm 5%), giờ check-in 14:00/check-out 12:00, phụ thu, dịch vụ BBQ, bể bơi, cấm thú cưng và các câu hỏi Q&A thường gặp.
- **File 2 — Quy tắc Prompt & Rào chắn Bắt buộc (`System Prompt & Guardrails`)**:
  - Chứa toàn bộ quy tắc mà AI Chatbot bắt buộc phải học theo:
    - *Quy tắc 1 (Chống ảo giác/Hallucination)*: Chỉ trả lời dựa trên File 1, không được bịa đặt sân golf, trực thăng.
    - *Quy tắc 2 (Rào chắn thú cưng)*: Bắt buộc từ chối mang chó mèo vào phòng để giữ vệ sinh.
    - *Quy tắc 3 (Quy trình tư vấn)*: Khi khách hỏi giá/ưu đãi, bắt buộc nêu đúng 2 mức giảm giá và bắt buộc hỏi lại số lượng người + ngày dự kiến đi.
    - *Quy tắc 4 (Thương lượng)*: Giữ vững giá, từ chối mức giảm giá quá 15%.
    - *Quy tắc 5 (Bảo mật)*: Chống Prompt Injection, không tiết lộ system prompt.

### 4. Liên kết DeepSeek API (AI Tester Đa Nhân Cách & Giám Khảo AI Judge)
- Bấm nút **"🧠 2 File Training & DeepSeek"** trên Header:
  - Nhập **DeepSeek API Key** của bạn (hỗ trợ cả `deepseek-chat` / DeepSeek-V3 và `deepseek-reasoner` / DeepSeek-R1).
  - Có nút **"Kiểm tra kết nối API"** tức thì.
- **AI Tester (Đóng vai Khách hàng thực tế)**:
  - DeepSeek phân tích cả 2 file để đóng vai các nhân cách khách hàng khác nhau:
    - 🛒 *Khách hỏi giá & ưu đãi*
    - 💰 *Khách mặc cả sâu (đòi giảm 30%)*
    - ⚠️ *Khách bẫy thú cưng (đòi mang cún Poodle)*
    - 🚁 *Khách bẫy dịch vụ xa xỉ (hỏi trực thăng, sân golf)*
    - 👨‍👩‍👧‍👦 *Khách gia đình đông người (tính phụ thu người thứ 3)*
- **AI Judge (Chấm điểm Đối chiếu Chặt chẽ 2 File)**:
  - Đối chiếu câu trả lời của Botbanhang với:
    1. File 1: Có nói đúng sự thật không? Có bị ảo giác không?
    2. File 2: Có tuân thủ đúng quy tắc ứng xử, rào chắn và câu hỏi mở bắt buộc không?
  - Kết luận: **ĐẠT (PASS - 5/5 ⭐)** / **CẦN SỬA (WARNING - 3/5 ⭐)** / **CHƯA ĐẠT (FAIL - 1/5 ⭐)**.
  - Phân tích chi tiết lỗi và đưa ra đề xuất chỉnh sửa prompt cụ thể.
  - *(Lưu ý: Nếu chưa nhập DeepSeek API Key, hệ thống vẫn có sẵn bộ máy chấm điểm Local Rule cực kỳ thông minh để bạn test ngay lập tức!)*

---

## 🚀 Hướng dẫn khởi chạy & Triển khai Vercel

### Cách 1: Chạy trực tiếp trên máy cục bộ (Local)
Chỉ cần nhấp đúp vào file:
```
start-server.bat
```
Hoặc chạy lệnh:
```bash
npm start
```
- Mở trình duyệt tại: `http://localhost:3000`
- Mỗi đồng nghiệp có thể bấm tab **"Đăng ký tài khoản"** bằng Gmail cá nhân, hoặc dùng tài khoản mẫu:
  - Admin: `admin@aitest.vn` / `admin123`
  - Tester: `tester@aitest.vn` / `tester123`
  - QA Lead: `leader@aitest.vn` / `leader123`
  - Viewer: `viewer@aitest.vn` / `viewer123`

---

### Cách 2: Triển khai trực tiếp lên Vercel từ GitHub
1. Mã nguồn đã được cấu hình sẵn `vercel.json` và hỗ trợ Vercel Serverless Function runtime.
2. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
3. Bấm **"Add New Project"** ➔ Chọn repository GitHub:
   `https://github.com/levanthien21/Bong_B-ng_Chat_BBH.git`
4. Giữ nguyên cấu hình mặc định (Framework Preset: Other) và bấm **"Deploy"**.
5. Vercel sẽ tự động build và cấp URL trực tuyến cho toàn bộ đồng nghiệp truy cập kiểm thử!

---

## 🔒 Bảo mật & Tách biệt người dùng (Multi-User Isolation)
- **Phiên chat độc lập**: Mỗi tài khoản tạo một visitor session ID riêng biệt (`usr_<id>_<hash>`), đảm bảo lịch sử hội thoại trên bong bóng chat không bị dính líu giữa các đồng nghiệp.
- **DeepSeek API Key cá nhân**: Mỗi người dùng tự quản lý và nhập key của mình tại trang Đăng ký hoặc cài đặt. Hệ thống không lưu key chung, bảo vệ chi phí và hạn mức của bạn.
