import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";

// Interface สำหรับข้อมูล User
interface UserData {
  citizen_id: string;
  first_name_th: string;
  last_name_th: string;
  mobile_number?: string;
  address?: string;
}

export default function Home() {
  const router = useRouter();
  
  // ✅ ดึงค่า Prefix จาก .env
  const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState<UserData>({
    citizen_id: "",
    first_name_th: "",
    last_name_th: "",
    mobile_number: "",
    address: "",
  });

  // 1. ตรวจสอบ mToken เมื่อ URL พร้อม
  useEffect(() => {
    if (!router.isReady) return;
    
    // ดึงค่า mToken จาก URL
    const { mToken } = router.query;

    if (mToken) {
      // แปลงให้เป็น String แน่นอน (เผื่อมันมาเป็น Array)
      const tokenStr = Array.isArray(mToken) ? mToken[0] : mToken;
      console.log("📌 Token from URL:", tokenStr); // เช็คว่ามีค่าไหม
      checkToken(tokenStr);
    } else {
        console.log("⚠️ No mToken found in URL");
    }
  }, [router.isReady, router.query]);

  // 2. ฟังก์ชันตรวจสอบ Token
  const checkToken = async (token: string) => {
    setIsLoading(true);
    setErrorMsg(""); 

    try {
      const apiUrl = `${API_PREFIX}/api/auth/login`;
      
      // ✅ Payload: ส่งไปทั้ง mToken และ token (กันเหนียว เผื่อหลังบ้านใช้ชื่ออื่น)
      const payload = { 
          mToken: token,
          token: token 
      };

      console.log(`🚀 Sending Request to: ${apiUrl}`);
      console.log("📦 Payload:", payload); // ดูตรงนี้ใน F12 ว่าส่งอะไรไป
      
      const res = await axios.post(apiUrl, payload, {
          headers: {
              'Content-Type': 'application/json'
          }
      });

      console.log("✅ Response:", res.data);

      if (res.data.status === "success" || res.data.code === "200" || res.status === 200) {
        const userData = res.data.data || res.data;
        
        setFormData({
            citizen_id: userData.citizen_id || "",
            first_name_th: userData.first_name_th || "",
            last_name_th: userData.last_name_th || "",
            mobile_number: userData.mobile_number || "", 
            address: userData.address || "" 
        });
        
        if (userData.is_registered) {
            setIsRegistered(true);
        }
      } else {
        setErrorMsg(res.data.message || "ยืนยันตัวตนไม่สำเร็จ (Unknown Status)");
      }

    } catch (error: any) {
      console.error("❌ Login Error Full:", error);
      
      // แกะ Error จาก Server
      const serverMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "เกิดข้อผิดพลาดในการเชื่อมต่อ Server";
      
      setErrorMsg(`System Error: ${serverMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ฟังก์ชันกดปุ่มลงทะเบียน
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_PREFIX}/api/user/register`, {
        citizen_id: formData.citizen_id,
        first_name_th: formData.first_name_th,
        last_name_th: formData.last_name_th,
        mobile_number: formData.mobile_number,
        address: formData.address,
      });

      if (res.status === 200 || res.data.status === "success") {
        alert("ลงทะเบียนสำเร็จเรียบร้อย!");
        setIsRegistered(true); 
      }

    } catch (error: any) {
      console.error("Register Error:", error);
      const message = error.response?.data?.message || error.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      alert(`Error: ${message}`);
      setErrorMsg(`Register Failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <Head>
        <title>ระบบยืนยันตัวตน (Debug Mode)</title>
      </Head>

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-800">
            ระบบยืนยันตัวตน
        </h1>
        <p className="text-center text-xs text-gray-400 mb-6">Backend: {API_PREFIX || 'Root'}</p>

        {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700 font-bold">เกิดข้อผิดพลาด:</p>
                        <p className="text-sm text-red-600 break-words">{errorMsg}</p>
                    </div>
                </div>
            </div>
        )}

        {isLoading && (
            <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">กรุณารอสักครู่ ระบบกำลังดึงข้อมูล...</p>
            </div>
        )}

        {!isLoading && !isRegistered && (
          <form onSubmit={handleRegister}>
            <div className="bg-blue-50 p-3 rounded mb-4 text-center text-sm text-blue-700">
                {!formData.citizen_id 
                    ? "สถานะ: รอรับข้อมูล Token..." 
                    : "ตรวจสอบข้อมูลและลงทะเบียน"
                }
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
              <input
                type="text"
                value={formData.citizen_id}
                readOnly
                className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                    <input 
                        type="text" 
                        value={formData.first_name_th} 
                        readOnly 
                        className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                    <input 
                        type="text" 
                        value={formData.last_name_th} 
                        readOnly 
                        className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                    />
                </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="08xxxxxxxx"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 font-semibold shadow-md"
            >
              ยืนยันการลงทะเบียน
            </button>
          </form>
        )}

        {isRegistered && (
            <div className="text-center py-10">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">ลงทะเบียนสำเร็จ!</h2>
                <p className="text-gray-600">ยินดีต้อนรับ คุณ{formData.first_name_th}</p>
                <p className="text-sm text-gray-400 mt-4">คุณสามารถปิดหน้านี้ได้ทันที</p>
            </div>
        )}
      </div>
    </div>
  );
}