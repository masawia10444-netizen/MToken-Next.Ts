import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";

// กำหนดโครงสร้างข้อมูล User
interface UserData {
  citizen_id: string;
  first_name_th: string;
  last_name_th: string;
  mobile_number?: string;
  address?: string;
}

export default function Home() {
  const router = useRouter();
  
  // ✅ ไฮไลท์สำคัญ: ดึงค่า Prefix จาก .env มาเก็บไว้ในตัวแปร
  // ถ้าใน .env เขียนว่า /test5 ตัวแปรนี้ก็จะเป็น /test5
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

  // 1. ตรวจสอบ mToken เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    if (!router.isReady) return;
    const { mToken } = router.query;

    if (mToken) {
      checkToken(mToken as string);
    }
  }, [router.isReady, router.query]);

  // 2. ฟังก์ชัน Login (เช็ค Token)
  const checkToken = async (token: string) => {
    setIsLoading(true);
    try {
      // ✅ เรียกใช้ API แบบมี Prefix
      const res = await axios.post(`${API_PREFIX}/api/auth/login`, {
        mToken: token,
      });

      if (res.data.status === "success") {
        const userData = res.data.data;
        setFormData({
            citizen_id: userData.citizen_id || "",
            first_name_th: userData.first_name_th || "",
            last_name_th: userData.last_name_th || "",
            mobile_number: userData.mobile_number || "", 
            address: userData.address || "" 
        });
        
        // ถ้าเคยลงทะเบียนแล้ว ให้ข้ามไปหน้า Success เลย
        if (userData.is_registered) {
            setIsRegistered(true);
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg("ไม่สามารถยืนยันตัวตนได้ หรือ Token หมดอายุ");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ฟังก์ชันลงทะเบียน (Handle Register)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // ✅ เรียกใช้ API แบบมี Prefix (จุดที่เคย Error จะหายไปตรงนี้)
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Head>
        <title>ระบบยืนยันตัวตน (Biza Test 5)</title>
      </Head>

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
            ระบบยืนยันตัวตน
        </h1>

        {isLoading && <p className="text-center text-gray-500">กำลังโหลด...</p>}
        {errorMsg && <p className="text-center text-red-500 mb-4">{errorMsg}</p>}

        {!isLoading && !isRegistered && (
          <form onSubmit={handleRegister}>
            <div className="bg-blue-50 p-3 rounded mb-4 text-center text-sm text-blue-700">
                {!formData.citizen_id ? "กรุณารอข้อมูล..." : "ไม่พบข้อมูล กรุณาลงทะเบียน"}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เลขบัตร (Locked)</label>
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
                placeholder="กรอกเบอร์โทรศัพท์"
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
                placeholder="กรอกที่อยู่ปัจจุบัน"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition duration-200 font-semibold"
            >
              ลงทะเบียนสมาชิก
            </button>
          </form>
        )}

        {isRegistered && (
            <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-green-600 text-xl font-bold">ลงทะเบียนเรียบร้อยแล้ว!</p>
                <p className="text-gray-600 mt-2">ขอบคุณ คุณ{formData.first_name_th}</p>
            </div>
        )}
      </div>
    </div>
  );
}