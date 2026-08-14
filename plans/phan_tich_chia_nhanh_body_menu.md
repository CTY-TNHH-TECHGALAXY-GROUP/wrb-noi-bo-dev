# Phân tích Yêu cầu: Tái cấu trúc danh mục Dịch vụ (Menu)

Dựa trên yêu cầu của bạn, hệ thống Menu hiện tại sẽ có một sự thay đổi lớn về mặt cấu trúc (Architecture). Đây là bản phân tích chi tiết từ góc nhìn của một **AI Sparring Partner**.

## 1. Bóc tách yêu cầu (Deconstruction)

Bạn muốn chia nhóm dịch vụ hiện tại (cụ thể là nhóm massage toàn thân) thành **3 luồng (nhãn) độc lập**:

1. **Relaxing (Thư giãn):**
   - Đóng vai trò là danh sách hiển thị các dịch vụ truyền thống như trong ảnh bạn gửi (Mix of 4 therapies, Hot stone, Four hand, No oil, Aroma).
   - *Hành vi:* Hiển thị dạng danh sách cuộn (List) như bình thường.

2. **Design your journey (Thiết kế hành trình):**
   - Đóng vai trò là một luồng tương tác tùy chỉnh ("Qua cuốn sách khác").
   - *Hành vi:* Không hiển thị danh sách cuộn có sẵn. Khi bấm vào, sẽ mở ra một giao diện hoàn toàn mới (có thể là lật trang, trượt màn hình) để khách hàng tự build liệu trình cho mình (chọn thời gian -> chọn vùng tập trung -> chọn kỹ thuật viên...).

3. **Therapy (Trị liệu):**
   - Cũng là một luồng chuyên sâu ("Qua cuốn sách khác").
   - *Hành vi:* Mở ra không gian riêng dành cho các dịch vụ trị liệu chuyên biệt (ví dụ: Trị liệu cổ vai gáy, bấm huyệt y học cổ truyền, căng cơ thể thao...). 

---

## 2. Phản biện & Đánh giá rủi ro UX (Sparring Partner)

Với tư cách là đối tác kỹ thuật, tôi nhận thấy có một số điểm chúng ta cần làm rõ trước khi code để tránh làm hỏng luồng UX hiện tại:

1. **Vị trí của 3 nhãn này nằm ở đâu?**
   - **Option A (Thay thế toàn cục):** Chúng sẽ thay thế hoàn toàn thanh Menu trên cùng (hiện đang là Body / Foot / Facial / Hair...)? Nếu vậy, các dịch vụ Foot/Facial sẽ nằm ở đâu?
   - **Option B (Cấp thư mục con):** Khách vẫn bấm vào mục "Body" trên thanh ngang. Sau khi bấm vào "Body", màn hình sẽ hiện ra 3 khối to (3 nhãn) này để khách rẽ nhánh. *(Tôi đề xuất Option B vì nó giữ được tính logic tổng thể của Spa).*

2. **Trải nghiệm "Qua cuốn sách khác" (Page Transition):**
   - Hiện tại toàn bộ app đang là một trang Client duy nhất (Single Page App). 
   - Để tạo cảm giác "lật sách" mượt mà, thay vì tải lại URL mới (làm gián đoạn âm thanh/video nền), tôi đề xuất sử dụng **Framer Motion** để tạo hiệu ứng trượt ngang (Slide) hoặc lật màn hình (Flip) đè lên giao diện hiện tại.

3. **Data Structure (Cấu trúc dữ liệu):**
   - Hiện tại trường `cat` (Category) trong Database đang lưu là `Body`. 
   - Chúng ta sẽ cần tạo thêm các Tag hoặc Category ID mới (vd: `cat: 'Relaxing'`, `cat: 'Therapy'`, `cat: 'CustomJourney'`) để filter dữ liệu cho đúng từng cuốn sách.

---

## 3. Đề xuất Hướng triển khai (Action Plan)

Nếu bạn đồng ý với hướng phân tích này, đây là các bước tôi sẽ làm:

**Bước 1: Làm UI trang rẽ nhánh (Hub)**
- Xây dựng một Component mới: Thay vì vào "Body" là sổ thẳng ra danh sách, vào "Body" sẽ hiện 3 thẻ bài rất đẹp (Relaxing, Design your journey, Therapy) để khách chọn.

**Bước 2: Xử lý Luồng "Relaxing"**
- Bấm vào Relaxing -> Trượt ra màn hình danh sách ServiceList cũ chứa các món Hot stone, Mix 4... 

**Bước 3: Xử lý Khung cơ bản cho "Design your journey" & "Therapy"**
- Tạo ra 2 Component "Cuốn sách mới" (hiện tại có thể là trang trắng với nút Back) áp dụng hiệu ứng lật trang để bạn chốt flow. Sau đó chúng ta sẽ đắp UI chi tiết vào 2 trang này sau.

## Câu hỏi cho bạn (Vui lòng trả lời để tôi tiến hành):
1. Bạn muốn 3 nhãn này nằm ngay **thanh ngang trên cùng** (thay thế Body, Foot...), hay là **khách chọn Body xong thì mới hiện 3 nhãn này**?
2. Trong luồng "Therapy", bạn dự định cho hiển thị dạng danh sách List như Relaxing, hay cũng là một luồng tương tác thiết kế riêng?
