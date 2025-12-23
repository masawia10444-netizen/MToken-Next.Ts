import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  UserIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';

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

  // ─────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentAppId, setCurrentAppId] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('ยินดีต้อนรับเข้าสู่ระบบ!');
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState<UserData>({
    citizen_id: '',
    first_name_th: '',
    last_name_th: '',
    mobile_number: '',
    address: '',
  });

  // ─────────────────────────────────────────────────
  // Check token on component mount
  // ─────────────────────────────────────────────────
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

  /**
   * Verify token with backend and load user data
   */
  const checkToken = async (token: string, appId: string) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload = { appId, mToken: token };
      const res = await axios.post(`${API_PREFIX}/api/auth/login`, payload);

      if (
        res.data.status === 'success' ||
        res.data.status === 'found' ||
        res.data.status === 'new_user' ||
        res.status === 200
      ) {
        const userData = res.data.data;
        if (userData) {
          const uid = userData.user_id || userData.userId || userData.id || '';
          setCurrentUserId(uid);

          setFormData({
            citizen_id: userData.citizen_id || userData.citizenId || '',
            first_name_th: userData.first_name_th || userData.firstName || '',
            last_name_th: userData.last_name_th || userData.lastName || '',
            mobile_number: userData.mobile_number || userData.mobile || '',
            address: userData.address || userData.additionalInfo || '',
          });

          if (res.data.status === 'found' || userData.is_registered === true) {
            setShowProfile(true);
          }
        }
      } else {
        setErrorMsg(res.data.message || 'ไม่สามารถยืนยันตัวตนได้');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      const serverMsg = error.response?.data?.message || error.message;
      setErrorMsg(`System Error: ${serverMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit registration form
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

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
        address: formData.address,
      };

      const res = await axios.post(`${API_PREFIX}/api/user/register`, registerPayload);

      if (res.status === 200 || res.data.status === 'success') {
        setIsRegistered(true);
      } else {
        alert('ลงทะเบียนไม่ผ่าน: ' + (res.data.message || 'Unknown Error'));
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      const message = error.response?.data?.message || error.message;
      alert(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send notification message
   */
  const sendNotify = async () => {
    if (!currentUserId) {
      alert('ไม่พบข้อมูล User ID');
      return;
    }

    setIsSending(true);
    try {
      const res = await axios.post(`${API_PREFIX}/api/notify/send`, {
        appId: currentAppId,
        userId: currentUserId,
        message: notifyMsg,
      });

      if (res.data.success) {
        alert('✅ ส่งแจ้งเตือนเรียบร้อย!');
      } else {
        alert('❌ ส่งไม่ผ่าน: ' + (res.data.message || res.data.error));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSending(false);
    }
  };

  // ─────────────────────────────────────────────────
  // UI Rendering
  // ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 font-sans text-gray-700">
      <Head>
        <title>ระบบยืนยันตัวตนดิจิทัล</title>
      </Head>

      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 relative overflow-hidden transition-all duration-500 hover:shadow-indigo-200/50">
        {/* Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />

        {/* Header */}
        <div className="relative text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4 transform rotate-3">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            ยืนยันตัวตน
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Citizen Digital ID Verification</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="relative bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="text-sm text-red-700 font-bold">เกิดข้อผิดพลาด</p>
                <p className="text-xs text-red-600">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full opacity-25" />
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-6 text-gray-500 text-sm font-medium tracking-wide">
              กำลังเชื่อมต่อฐานข้อมูล...
            </p>
          </div>
        )}

        {/* 1. Registration Form */}
        {!isLoading && !isRegistered && !showProfile && (
          <form onSubmit={handleRegister} className="relative space-y-5 animate-fadeIn">
            <div className="bg-blue-50/80 p-4 rounded-2xl text-center text-sm text-blue-800 border border-blue-100 shadow-inner">
              {!formData.citizen_id ? (
                <span className="flex items-center justify-center gap-2">⏳ รอรับข้อมูล Token...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  👋 ไม่พบข้อมูลสมาชิก <b>กรุณาลงทะเบียน</b>
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">
                  เลขบัตรประชาชน
                </label>
                <input
                  type="text"
                  value={formData.citizen_id}
                  readOnly
                  className="block w-full bg-gray-50 border-0 rounded-xl p-3.5 text-gray-600 font-mono shadow-inner ring-1 ring-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    value={formData.first_name_th}
                    readOnly
                    className="block w-full bg-gray-50 border-0 rounded-xl p-3.5 text-gray-600 shadow-inner ring-1 ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    value={formData.last_name_th}
                    readOnly
                    className="block w-full bg-gray-50 border-0 rounded-xl p-3.5 text-gray-600 shadow-inner ring-1 ring-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-500 uppercase mb-1 ml-1">
                  เบอร์โทรศัพท์ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="block w-full border-0 ring-1 ring-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm placeholder-gray-300"
                  placeholder="08x-xxx-xxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-500 uppercase mb-1 ml-1">
                  ที่อยู่ปัจจุบัน <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="block w-full border-0 ring-1 ring-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm placeholder-gray-300 min-h-[100px]"
                  placeholder="บ้านเลขที่, ถนน, ตำบล..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all duration-200 mt-4"
            >
              ยืนยันการลงทะเบียน
            </button>
          </form>
        )}

        {/* 2. Success Screen */}
        {isRegistered && (
          <div className="text-center py-10 animate-fadeIn">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">ลงทะเบียนสำเร็จ!</h2>
            <p className="text-gray-500 mb-8">ยินดีต้อนรับเข้าสู่ครอบครัวดิจิทัล</p>
            <div className="bg-green-50 rounded-2xl p-4 mb-8 border border-green-100 inline-block w-full">
              <p className="text-sm text-green-700 font-medium">
                คุณ {formData.first_name_th} {formData.last_name_th}
              </p>
            </div>
            <button
              onClick={() => {
                setIsRegistered(false);
                setShowProfile(true);
              }}
              className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              เข้าสู่หน้าโปรไฟล์ <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 3. Profile Screen */}
        {showProfile && (
          <div className="relative animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white shadow-xl ring-4 ring-white mb-4">
                <UserIcon className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {formData.first_name_th} {formData.last_name_th}
              </h2>
              <p className="text-gray-400 text-sm font-mono mt-1">{formData.citizen_id}</p>
              <div className="mt-3 inline-flex items-center px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                ยืนยันตัวตนแล้ว (Verified)
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 mb-6 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">เบอร์โทรศัพท์</span>
                <span className="text-sm font-medium text-gray-700">{formData.mobile_number || '-'}</span>
              </div>
              <div className="flex justify-between items-start pt-1">
                <span className="text-xs font-bold text-gray-400 uppercase mt-0.5">ที่อยู่</span>
                <span className="text-sm font-medium text-gray-700 text-right max-w-[60%]">
                  {formData.address || '-'}
                </span>
              </div>
            </div>

            {/* Notification Tester */}
            <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200/60 shadow-sm">
              <label className="block text-xs font-bold text-yellow-700 uppercase mb-3 flex items-center gap-2">
                <BellAlertIcon className="w-4 h-4" /> ทดสอบระบบแจ้งเตือน (Notification)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notifyMsg}
                  onChange={(e) => setNotifyMsg(e.target.value)}
                  className="flex-1 text-sm p-3 border-0 ring-1 ring-yellow-300/50 rounded-xl bg-white focus:ring-2 focus:ring-yellow-400 transition-all outline-none"
                  placeholder="ข้อความ..."
                />
                <button
                  onClick={sendNotify}
                  disabled={isSending}
                  className="bg-yellow-400 text-yellow-900 px-5 py-2 rounded-xl font-bold hover:bg-yellow-500 disabled:opacity-50 transition shadow-md"
                >
                  {isSending ? '...' : 'ส่ง'}
                </button>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-8 w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" /> ออกจากระบบ
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}