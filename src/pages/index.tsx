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
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ เพิ่มตัวแปรสำหรับเก็บ userId
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

      // เช็คว่ายิง API ติดไหม
      if (res.data.status === "success" || res.data.status === "found" || res.data.status === "new_user" || res.status === 200) {

        const userData = res.data.data;
        if (userData) {
          const uid = userData.user_id || userData.userId || userData.id || "";
          setCurrentUserId(uid);

          // เอาข้อมูลมาพ่นใส่ฟอร์มรอไว้ก่อน
          setFormData({
            citizen_id: userData.citizen_id || userData.citizenId || "",
            first_name_th: userData.first_name_th || userData.firstName || "",
            last_name_th: userData.last_name_th || userData.lastName || "",
            mobile_number: userData.mobile_number || userData.mobile || "",
            address: userData.address || userData.additionalInfo || ""
          });

          // 🛑 แก้ไขจุดสำคัญตรงนี้! 🛑
          // ต้องเช็คให้ชัวร์ว่า Backend บอกว่า "เจอแล้ว" (found) จริงๆ ถึงจะให้ผ่าน
          // ห้ามใช้แค่ if(uid) เพราะ User ใหม่ก็มี uid จากรัฐส่งมาเหมือนกัน
          if (res.data.status === 'found' || userData.is_registered === true) {
            setIsRegistered(true); // เฉพาะคนเก่าเท่านั้น ถึงจะข้ามไปหน้า Success
          }
          // กรณีอื่น (new_user) มันจะไม่เข้า if นี้ -> จะโชว์ฟอร์มให้กดลงทะเบียน (ถูกต้องแล้ว!)
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
      // ✅ ส่ง userId กลับไปด้วย (Database จะได้รู้ว่าของใคร)
      const registerPayload = {
        userId: currentUserId,         // <-- ตัวเอกของงานนี้
        user_id: currentUserId,        // กันเหนียว ส่งไปสองชื่อเลย
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

      console.log("Register Payload:", registerPayload); // เช็คใน F12 ได้เลย

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
            <p className="text-sm text-red-700 font-bold">เกิดข้อผิดพลาด: {errorMsg}</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-gray-500 text-sm">กำลังดำเนินการ...</p>
          </div>
        )}

        {!isLoading && !isRegistered && (
          <form onSubmit={handleRegister}>
            <div className="bg-blue-50 p-3 rounded mb-4 text-center text-sm text-blue-700">
              {!formData.citizen_id
                ? "สถานะ: รอรับข้อมูล..."
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
                <input type="text" value={formData.first_name_th} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                <input type="text" value={formData.last_name_th} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-500" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows={3}
                required
              />
            </div>

            <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 font-semibold shadow-md">
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