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
  const [isRegistered, setIsRegistered] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [currentUserId, setCurrentUserId] = useState(""); 
  const [currentAppId, setCurrentAppId] = useState("");
  
  // ✅ เพิ่ม State สำหรับข้อความแจ้งเตือน
  const [notifyMessage, setNotifyMessage] = useState("ยินดีต้อนรับเข้าสู่ระบบ!");
  const [isSending, setIsSending] = useState(false);

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
            
            if (res.data.status === 'found' || userData.is_registered === true) {
                 setShowProfile(true); 
            } 
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

  // ✅ ฟังก์ชันส่ง Notify (แปลงจากโค้ดเดิม)
  const sendNotify = async () => {
    if (!currentUserId) return;
    setIsSending(true);

    try {
        const res = await axios.post(`${API_PREFIX}/api/notify/send`, {
            appId: currentAppId,
            userId: currentUserId, // หรือ formData.citizen_id
            message: notifyMessage
        });

        if (res.data.success) {
            alert("✅ ส่งแจ้งเตือนเรียบร้อย!");
        } else {
            alert("❌ ส่งไม่ผ่าน: " + (res.data.message || res.data.error));
        }
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <Head>
        <title>ระบบยืนยันตัวตน</title>
      </Head>

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
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

        {/* ฟอร์มลงทะเบียน */}
        {!isLoading && !isRegistered && !showProfile && (
          <form onSubmit={handleRegister}>
            {/* ... (ส่วนฟอร์มลงทะเบียน เหมือนเดิม ไม่ได้แก้) ... */}
            <div className="bg-blue-50 p-3 rounded-lg mb-6 text-center text-sm text-blue-800 border border-blue-100">
                {!formData.citizen_id ? "สถานะ: รอรับข้อมูล..." : "👋 ไม่พบข้อมูลสมาชิก กรุณาลงทะเบียน"}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">เลขบัตรประชาชน</label>
              <input type="text" value={formData.citizen_id} readOnly className="block w-full bg-gray-100 border-gray-200 rounded-lg p-2.5 text-gray-500 text-sm font-mono" />
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
              <input type="text" value={formData.mobile_number} onChange={(e) => setFormData({...formData, mobile_number: e.target.value})} className="block w-full border border-gray-300 rounded-lg p-2.5" placeholder="08x-xxx-xxxx" required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">ที่อยู่</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="block w-full border border-gray-300 rounded-lg p-2.5" rows={3} placeholder="บ้านเลขที่..." required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition duration-200 font-bold shadow-lg shadow-blue-500/30">ลงทะเบียนสมาชิก</button>
          </form>
        )}

        {/* หน้า Success */}
        {isRegistered && (
            <div className="text-center py-8 animate-fade-in-up">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">ลงทะเบียนสำเร็จ!</h2>
                <p className="text-gray-600 mb-6">ยินดีต้อนรับ คุณ{formData.first_name_th}</p>
                <button onClick={() => { setIsRegistered(false); setShowProfile(true); }} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition font-medium">ไปที่หน้าโปรไฟล์ →</button>
            </div>
        )}

        {/* หน้า Profile + Notification */}
        {showProfile && (
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                    {formData.first_name_th.charAt(0)}
                </div>
                
                <h2 className="text-xl font-bold text-gray-800">{formData.first_name_th} {formData.last_name_th}</h2>
                <div className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">✓ ยืนยันตัวตนแล้ว</div>

                {/* ✅ ส่วนส่งแจ้งเตือน */}
                <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-left">
                    <label className="block text-xs font-bold text-yellow-700 uppercase mb-2">📢 ทดสอบส่งแจ้งเตือน</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={notifyMessage}
                            onChange={(e) => setNotifyMessage(e.target.value)}
                            className="flex-1 text-sm p-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <button 
                            onClick={sendNotify}
                            disabled={isSending}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 transition"
                        >
                            {isSending ? '...' : 'ส่ง'}
                        </button>
                    </div>
                </div>

                <button onClick={() => window.location.reload()} className="mt-6 w-full py-3 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition">ออกจากระบบ</button>
            </div>
        )}

      </div>
    </div>
  );
}