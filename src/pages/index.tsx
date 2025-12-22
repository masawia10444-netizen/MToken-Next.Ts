import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";

// กำหนด Interface ของข้อมูล User
interface UserData {
  citizen_id: string;
  first_name_th: string;
  last_name_th: string;
  mobile_number?: string;
  address?: string;
}

export default function Home() {
  const router = useRouter();
  
  // ✅ ดึงค่า Prefix จาก .env มาใช้ (เช่น /test5)
  // ถ้าลืมตั้งค่า มันจะเป็นค่าว่าง '' (ก็ยังทำงานได้ถ้าอยู่ root)
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

  // 1. เช็ค mToken เมื่อหน้าเว็บโหลด
  useEffect(() => {
    if (!router.isReady) return;
    const { mToken } = router.query;

    if (mToken) {
      checkToken(mToken as string);
    }
  }, [router.isReady, router.query]);

  // 2. ฟังก์ชันเช็ค Token
  const checkToken = async (token: string) => {
    setIsLoading(true);
    try {
      // ✅ ใช้ API_PREFIX แทนการเขียน /test5 ตรงๆ
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

  // 3. ฟังก์ชันลงทะเบียน
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // ✅ ใช้ API_PREFIX ตรงนี้ด้วย สบายใจหายห่วง
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
        <title>Biza Test 5</title>
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
                ไม่พบข้อมูล กรุณาลงทะเบียน
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เลขบัตร (Locked)</label>
              <input
                type="text"
                value={formData.citizen_id}
                readOnly
                className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                    <input 
                        type="text" 
                        value={formData.first_name_th} 
                        readOnly 
                        className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                    <input 
                        type="text" 
                        value={formData.last_name_th} 
                        readOnly 
                        className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition duration-200"
            >
              ลงทะเบียนสมาชิก
            </button>
          </form>
        )}

        {isRegistered && (
            <div className="text-center">
                <p className="text-green-600 text-lg font-bold">ลงทะเบียนเรียบร้อยแล้ว!</p>
                <p className="text-gray-600 mt-2">ยินดีต้อนรับคุณ {formData.first_name_th}</p>
            </div>
        )}
      </div>
    </div>
  );
}