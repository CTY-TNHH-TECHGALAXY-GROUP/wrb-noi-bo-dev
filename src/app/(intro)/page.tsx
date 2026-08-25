import { redirect } from 'next/navigation';

export default function IntroPage() {
  // Bỏ qua Customer Type, vào thẳng vòng xoay category mặc định là tiếng Anh
  redirect('/en/new-user/standard/menu');
}
