import { redirect } from 'next/navigation';

export default function IntroPage() {
  // Bỏ qua Intro và Auth, vào thẳng trang Customer Type mặc định là tiếng Anh
  redirect('/en/customer-type');
}