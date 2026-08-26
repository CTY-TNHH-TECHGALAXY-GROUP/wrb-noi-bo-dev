import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const nextParam = searchParams.get('next') ?? '/en/auth'

    const code = searchParams.get('code')

    // Nếu có code trả về (kiểu tường minh)
    if (code) {
        // Có thể thực hiện SSR code auth ở đây như bạn đã làm.
        // Tạm lược bỏ để tập trung vào Flow Implicit Hash của Google.
    }

    // NẾU KHÔNG CÓ CODE (Nghĩa là Access Token nằm ở Hash URL: #access_token=...)
    // Máy chủ server (Next.js config này) sẽ không đọc được Hash Fragment qua URL.
    // Cách xử lý: Trả về một trang HTML rỗng, script nhỏ chạy tĩnh trên Browser 
    // để lấy cái Hash đó nhét vào Cookie/Session và Redirect tiếp!
    return new NextResponse(`
        <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
                <script>
                    window.onload = function() {
                        const supabaseClient = supabase.createClient(
                            "${process.env.NEXT_PUBLIC_SUPABASE_URL}",
                            "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
                        );
                        
                        // Lấy session từ Hash URL Fragment
                        supabaseClient.auth.getSession().then(({ data, error }) => {
                            if (!error && data.session) {
                                // Supabase JS tự động lưu session vào localStorage của trình duyệt
                                // Chuyển hướng thành công tới trang Next
                                window.location.replace("${origin}${nextParam}");
                            } else {
                                console.error('Auth Error:', error);
                                window.location.replace("${origin}/en/auth?error=auth_failed");
                            }
                        });
                    };
                </script>
            </head>
            <body style="background: #0f1218; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0;">
                <div style="text-align: center;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-bottom: 16px;">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    <p style="font-weight: 500;">Đang xác thực thông tin...</p>
                    <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
                </div>
            </body>
        </html>
    `, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}
