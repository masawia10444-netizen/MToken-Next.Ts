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
  const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // สำหรับหน้า Success (จุดพลุ)
  const [showProfile, setShowProfile] = useState(false);   // ✅ สำหรับหน้า Profile (คนเก่า)
  const [errorMsg, setErrorMsg] = useState("");
  
  const [currentUserId, setCurrentUserId] = useState(""); 
  const [currentAppId, setCurrentAppId] = useState("");

  const [formData, setFormData] = useState<UserData>({
    citizen_id: "",
    first_name_th: "",
    last_name_th: "",
    mobile_number: "",
    address: "",
  });

  useEffect(() => {
    if (!router.isReady) return;
    const { mToken, appId } = router.query;

    if (mToken && appId) {
      const tokenStr = Array.isArray(mToken) ? mToken[0] : mToken;
      const appIdStr = Array.isArray(appId) ? appId[0] : appId;
      
      setCurrentAppId(appIdStr);
      checkToken(tokenStr, appIdStr);
    } 
  }, [router.isReady, router.query]);

  const checkToken = async (token: string, appId: string) => {
    setIsLoading(true);
    setErrorMsg(""); 

    try {
      const payload = { appId: appId, mToken: token };
      const res = await axios.post(`${API_PREFIX}/api/auth/login`, payload);

      if (res.data.status === "success" || res.data.status === "found" || res.data.status === "new_user" || res.status === 200) {
        
        const userData = res.data.data;
        if(userData) {
             const uid = userData.user_id || userData.userId || userData.id || "";
             setCurrentUserId(uid);

             setFormData({
                citizen_id: userData.citizen_id || userData.citizenId || "",
                first_name_th: userData.first_name_th || userData.firstName || "",
                last_name_th: userData.last_name_th || userData.lastName || "",
                mobile_number: userData.mobile_number || userData.mobile || "", 
                address: userData.address || userData.additionalInfo || "" 
            });
            
            // ✅ แก้ไข Logic: ถ้าเป็นคนเก่า (found) ให้ไปหน้า Profile
            if (res.data.status === 'found' || userData.is_registered === true) {
                 setShowProfile(true); // <--- ไปหน้า Profile แทน
            } 
            // ถ้าเป็น new_user ก็จะหลุดไปโชว์ฟอร์มลงทะเบียนปกติ
        }
      } else {
        setErrorMsg(res.data.message || "Login Failed");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      const serverMsg = error.response?.data?.message || error.message;
      setErrorMsg(`System Error: ${serverMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const registerPayload = {
        userId: currentUserId,
        user_id: currentUserId,
        appId: currentAppId,
        citizenId: formData.citizen_id,
        citizen_id: formData.citizen_id,
        firstName: formData.first_name_th,
        lastName: formData.last_name_th,
        mobile: formData.mobile_number,
        mobile_number: formData.mobile_number,
        additionalInfo: formData.address,
        address: formData.address
      };

      const res = await axios.post(`${API_PREFIX}/api/user/register`, registerPayload);

      if (res.status === 200 || res.data.status === "success") {
        setIsRegistered(true); // ✅ ถ้าเพิ่งลงทะเบียนเสร็จ ให้โชว์หน้าจุดพลุ
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

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Header โลโก้ */}
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-900">
                ระบบยืนยันตัวตน
            </h1>
            <p className="text-xs text-gray-400 mt-1">Digital Identity Verification</p>
        </div>

        {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r">
                <p className="text-sm text-red-700 font-bold">เกิดข้อผิดพลาด: {errorMsg}</p>
            </div>
        )}

        {isLoading && (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 text-sm animate-pulse">กำลังตรวจสอบข้อมูล...</p>
            </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CASE 1: ฟอร์มลงทะเบียน (สำหรับคนใหม่) */}
        {/* ---------------------------------------------------- */}
        {!isLoading && !isRegistered && !showProfile && (
          <form onSubmit={handleRegister}>
            <div className="bg-blue-50 p-3 rounded-lg mb-6 text-center text-sm text-blue-800 border border-blue-100">
                {!formData.citizen_id 
                    ? "สถานะ: รอรับข้อมูล..." 
                    : "👋 ไม่พบข้อมูลสมาชิก กรุณาลงทะเบียน"
                }
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">เลขบัตรประชาชน</label>
              <input
                type="text"
                value={formData.citizen_id}
                readOnly
                className="block w-full bg-gray-100 border-gray-200 rounded-lg p-2.5 text-gray-500 text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อ</label>
                    <input type="text" value={formData.first_name_th} readOnly className="block w-full bg-gray-100 border-gray-200 rounded-lg p-2.5 text-gray-500 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">นามสกุล</label>
                    <input type="text" value={formData.last_name_th} readOnly className="block w-full bg-gray-100 border-gray-200 rounded-lg p-2.5 text-gray-500 text-sm" />
                </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="08x-xxx-xxxx"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                rows={3}
                placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล..."
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition duration-200 font-bold shadow-lg shadow-blue-500/30">
              ลงทะเบียนสมาชิก
            </button>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* CASE 2: หน้า Success (เพิ่งลงทะเบียนเสร็จ) */}
        {/* ---------------------------------------------------- */}
        {isRegistered && (
            <div className="text-center py-8 animate-fade-in-up">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">ลงทะเบียนสำเร็จ!</h2>
                <p className="text-gray-600 mb-6">ยินดีต้อนรับ คุณ{formData.first_name_th}</p>
                
                <button 
                    onClick={() => { setIsRegistered(false); setShowProfile(true); }}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition font-medium"
                >
                    ไปที่หน้าโปรไฟล์ →
                </button>
            </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CASE 3: หน้า Profile (สำหรับคนเก่า / Login เข้ามา) */}
        {/* ---------------------------------------------------- */}
        {showProfile && (
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                    {formData.first_name_th.charAt(0)}
                </div>
                
                <h2 className="text-xl font-bold text-gray-800">
                    {formData.first_name_th} {formData.last_name_th}
                </h2>
                <p className="text-sm text-gray-500 font-mono mt-1">{formData.citizen_id}</p>
                
                <div className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    ✓ ยืนยันตัวตนแล้ว
                </div>

                <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                    <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase font-bold">เบอร์โทรศัพท์</p>
                        <p className="text-gray-700 font-medium">{formData.mobile_number || "-"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">ที่อยู่</p>
                        <p className="text-gray-700 font-medium">{formData.address || "-"}</p>
                    </div>
                </div>

                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 w-full py-3 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition"
                >
                    ออกจากระบบ
                </button>
            </div>
        )}

      </div>
    </div>
  );
}