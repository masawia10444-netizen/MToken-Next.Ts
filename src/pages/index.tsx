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
  
  // States สำหรับเก็บค่าต่างๆ
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // State สำหรับเก็บข้อมูลแบบฟอร์ม (ดึงมาจาก mToken หรือกรอกเพิ่ม)
  const [formData, setFormData] = useState<UserData>({
    citizen_id: "",
    first_name_th: "",
    last_name_th: "",
    mobile_number: "",
    address: "",
  });

  // 1. useEffect: ทำงานตอนเปิดหน้าเว็บ เพื่อเช็ค mToken ใน URL
  useEffect(() => {
    if (!router.isReady) return;

    // สมมติว่ารับค่ามาจาก Query Param (หรือจะดึงจาก localStorage ก็ได้)
    const { mToken, appID } = router.query;

    if (mToken) {
      checkToken(mToken as string);
    }
  }, [router.isReady, router.query]);

  // 2. ฟังก์ชันเช็ค Token กับ Backend
  const checkToken = async (token: string) => {
    setIsLoading(true);
    try {
      // ✅ จุดที่ 1: ต้องมี /test5 นำหน้า API
      const res = await axios.post("/test5/api/auth/login", {
        mToken: token,
      });

      if (res.data.status === "success") {
        // ถ้ามีข้อมูล User กลับมา ให้เอามาใส่ใน Form
        const userData = res.data.data;
        setFormData({
            citizen_id: userData.citizen_id || "",
            first_name_th: userData.first_name_th || "",
            last_name_th: userData.last_name_th || "",
            mobile_number: userData.mobile_number || "", // เบอร์อาจจะยังไม่มี
            address: userData.address || "" // ที่อยู่อาจจะยังไม่มี
        });
        
        // เช็คว่า User คนนี้ลงทะเบียนหรือยัง (สมมติว่า backend ส่ง flag มาบอก)
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

  // 3. ฟังก์ชันกดปุ่ม "ลงทะเบียนสมาชิก" (ที่เป็นปัญหาอยู่)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post("/test5/api/user/register", {
        citizen_id: formData.citizen_id,
        first_name_th: formData.first_name_th,
        last_name_th: formData.last_name_th,
        mobile_number: formData.mobile_number,
        address: formData.address,
      });

      if (res.status === 200 || res.data.status === "success") {
        alert("ลงทะเบียนสำเร็จเรียบร้อย!");
        setIsRegistered(true); // เปลี่ยนหน้าจอเป็นหน้า Profile
      }

    } catch (error: any) {
      console.error("Register Error:", error);
      // แสดง Error ที่ชัดเจน
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
            ระบบยืนยันตัวตน V1.0
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