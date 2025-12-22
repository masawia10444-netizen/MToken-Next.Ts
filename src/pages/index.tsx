import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";

interface UserData {
  citizen_id: string;
  first_name_th: string;
  last_name_th: string;
  mobile_number?: string;
  address?: string;
}

export default function Home() {
  const router = useRouter();
  
  // Prefix API
  const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // เก็บ appId ไว้ใช้ตอนกดลงทะเบียนด้วย (ถ้าจำเป็น)
  const [currentAppId, setCurrentAppId] = useState("");

  const [formData, setFormData] = useState<UserData>({
    citizen_id: "",
    first_name_th: "",
    last_name_th: "",
    mobile_number: "",
    address: "",
  });

  // 1. รอ URL พร้อม แล้วดึงค่า appId และ mToken
  useEffect(() => {
    if (!router.isReady) return;
    
    // ✅ ดึงทั้ง mToken และ appId
    const { mToken, appId } = router.query;

    if (mToken && appId) {
      const tokenStr = Array.isArray(mToken) ? mToken[0] : mToken;
      const appIdStr = Array.isArray(appId) ? appId[0] : appId;
      
      console.log("📌 Params Found:", { mToken: tokenStr, appId: appIdStr });
      setCurrentAppId(appIdStr); // เก็บใส่ State ไว้
      
      // ส่งไปเช็คทั้งคู่
      checkToken(tokenStr, appIdStr);
    } else {
       console.log("⚠️ Missing Parameters: need both mToken and appId");
       if(!mToken && !appId) {
           // กรณีเปิดเว็บมาเฉยๆ ไม่มี param อะไรเลย
       } else {
           setErrorMsg("ข้อมูลไม่ครบ: ต้องการ appId และ mToken ใน URL");
       }
    }
  }, [router.isReady, router.query]);

  // 2. ฟังก์ชัน Login (ปรับปรุงใหม่!)
  const checkToken = async (token: string, appId: string) => {
    setIsLoading(true);
    setErrorMsg(""); 

    try {
      console.log(`🚀 Sending Login Request...`);
      
      // ✅ Payload ที่ถูกต้อง (ตามโค้ดเก่าที่ Success)
      const payload = { 
        appId: appId,
        mToken: token
      };

      const res = await axios.post(`${API_PREFIX}/api/auth/login`, payload, {
          headers: { 'Content-Type': 'application/json' }
      });

      console.log("✅ Response:", res.data);

      // Backend เก่าอาจจะส่ง status: 'found' หรือ 'success'
      if (res.data.status === "success" || res.data.status === "found" || res.status === 200) {
        
        // กรณีเจอข้อมูล User (found)
        if(res.data.data) {
             const userData = res.data.data;
             setFormData({
                citizen_id: userData.citizen_id || userData.citizenId || "",
                first_name_th: userData.first_name_th || userData.firstName || "",
                last_name_th: userData.last_name_th || userData.lastName || "",
                mobile_number: userData.mobile_number || userData.mobile || "", 
                address: userData.address || userData.additionalInfo || "" 
            });
            
            // เช็คว่าต้องลงทะเบียนใหม่ หรือ Login ได้เลย
            if (userData.is_registered || res.data.status === 'found') {
                 // ถ้า Backend บอกว่า found แปลว่ามีข้อมูลแล้ว
                 // แต่ใน Test 5 เราอาจจะอยากให้โชว์หน้าฟอร์มก่อน หรือจะให้ข้ามไปเลยก็ได้
                 // อันนี้ผมตั้งให้มันโชว์ข้อมูลในฟอร์มก่อน (แต่ User อาจจะแก้ไขไม่ได้เพราะ Locked)
                 // setIsRegistered(true); // ถ้าอยากให้ข้ามไปหน้า Success เลย ให้เปิดบรรทัดนี้
            }
        }
        
      } else if (res.data.status === "new_user") {
          // กรณี User ใหม่ (ต้องลงทะเบียน)
          const newUserData = res.data.data;
          setFormData({
            citizen_id: newUserData.citizenId || "",
            first_name_th: newUserData.firstName || "",
            last_name_th: newUserData.lastName || "",
            mobile_number: "",
            address: ""
          });
          // อยู่หน้าฟอร์มปกติ (ถูกต้องแล้ว)
      } else {
        setErrorMsg(res.data.message || "Login Failed");
      }

    } catch (error: any) {
      console.error("❌ Login Error:", error);
      const serverMsg = error.response?.data?.message || error.message;
      setErrorMsg(`System Error: ${serverMsg}`);
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
      // ✅ ส่งข้อมูลลงทะเบียน (อาจจะต้องส่ง appId ด้วยไหม? ใส่ไปเผื่อก่อน)
      const registerPayload = {
        appId: currentAppId, // เผื่อ Backend ต้องใช้
        citizen_id: formData.citizen_id, // หรือ citizenId ตาม Backend
        citizenId: formData.citizen_id,   // ส่งไป 2 ชื่อ กันเหนียว
        first_name_th: formData.first_name_th,
        firstName: formData.first_name_th,
        last_name_th: formData.last_name_th,
        lastName: formData.last_name_th,
        mobile_number: formData.mobile_number,
        mobile: formData.mobile_number,
        address: formData.address,
        additionalInfo: formData.address
      };

      const res = await axios.post(`${API_PREFIX}/api/user/register`, registerPayload);

      if (res.status === 200 || res.data.status === "success") {
        alert("ลงทะเบียนสำเร็จเรียบร้อย!");
        setIsRegistered(true); 
      } else {
         alert("ลงทะเบียนไม่ผ่าน: " + (res.data.message || "Unknown Error"));
      }

    } catch (error: any) {
      console.error("Register Error:", error);
      const message = error.response?.data?.message || error.message;
      alert(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <Head>
        <title>ระบบยืนยันตัวตน</title>
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
                <p className="mt-2 text-gray-500 text-sm">กำลังเชื่อมต่อระบบ...</p>
            </div>
        )}

        {!isLoading && !isRegistered && (
          <form onSubmit={handleRegister}>
            <div className="bg-blue-50 p-3 rounded mb-4 text-center text-sm text-blue-700">
                {!formData.citizen_id 
                    ? "สถานะ: รอรับข้อมูล (Token & AppID)..." 
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
            </div>
        )}
      </div>
    </div>
  );
}