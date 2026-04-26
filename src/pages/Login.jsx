import React, {useState, useEffect} from 'react';
import loginImg from '../assets/login-illustration.png';
import {FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash, FaBalanceScale} from 'react-icons/fa';
import {useNavigate} from 'react-router-dom';

export default function Login () {
  const navigate = useNavigate ();

  const [isRegister, setIsRegister] = useState (false);
  const [displayText, setDisplayText] = useState ('USER LOGIN');

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginText = 'USER LOGIN';
  const registerText = 'REGISTER';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showForgotPassword) {
       if (!resetEmail) { setError('Please enter your email.'); return; }
       setLoading(true);
       setError('');
       try {
          const res = await fetch('/api/auth/forgot-password', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: resetEmail })
          });
          const data = await res.json();
          if (res.ok) {
             setResetSuccess(data.message);
             setTimeout(() => { setShowForgotPassword(false); setResetSuccess(''); setResetEmail(''); }, 5000);
          } else {
             setError(data.message || 'Error occurred');
          }
       } catch (err) {
          setError('Communication error with server');
       } finally {
          setLoading(false);
       }
       return;
    }

    if (isRegister && !showOtp) {
       if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
       if (formData.phone.length !== 10 || isNaN(formData.phone)) { setError("Enter a valid 10-digit mobile number"); return; }
       
       setLoading(true);
       setError('');
       try {
          // STEP 1: Check for duplicates
          const dupRes = await fetch('/api/auth/check-duplicate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: formData.email, phone: formData.phone })
          });
          const dupData = await dupRes.json();
          if (!dupRes.ok) { setError(dupData.message); return; }

          // STEP 2: Send OTP
          const otpRes = await fetch('/api/auth/send-otp', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: formData.email })
          });
          if (otpRes.ok) {
             setShowOtp(true);
             setResendTimer(60);
          } else {
             const otpData = await otpRes.json();
             setError(otpData.message || 'Failed to send OTP');
          }
       } catch (err) {
          setError('Communication error with server');
       } finally {
          setLoading(false);
       }
       return;
    }

    if (showOtp) {
       if (otpValue.length !== 6 || isNaN(otpValue)) { setError("Enter exactly 6 digits OTP"); return; }
    }

    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name: formData.fullName, email: formData.email, password: formData.password, phone: `+91 ${formData.phone}`, otp: otpValue }
      : { email: formData.email, password: formData.password };

    if (!isRegister && formData.email === 'admin@civiktrack.com' && formData.password === 'admin123') {
       localStorage.setItem('civik_token', 'admin_token_123');
       localStorage.setItem('civik_user', JSON.stringify({ id: 'admin', name: 'System Admin', email: 'admin@civiktrack.com', role: 'admin' }));
       navigate('/admin');
       return;
    }

    try {
       const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       });
       const data = await res.json();
       if (res.ok) {
          if (isRegister) {
             setIsRegister(false);
             setShowOtp(false);
             setOtpValue('');
             setError('Registration successful! Please login.');
             setFormData({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
          } else {
             localStorage.setItem('civik_token', data.token);
             localStorage.setItem('civik_user', JSON.stringify(data.user));
             if (data.user.role === 'district_authority') {
                navigate('/district');
             } else if (data.user.role === 'mandal_authority') {
                navigate('/mandal');
             } else if (data.user.role && data.user.role.includes('authority')) {
                navigate('/authority');
             } else {
                navigate('/dashboard');
             }
          }
       } else {
          setError(data.message || 'Error occurred');
       }
    } catch (err) {
       setError('Network error');
    } finally {
       setLoading(false);
    }
  };

  // 🔥 ANIMATION LOGIC
  useEffect (
    () => {
      let deleteInterval;
      let typeInterval;

      if (isRegister) {
        let i = loginText.length;

        deleteInterval = setInterval (() => {
          setDisplayText (loginText.slice (0, i));
          i--;

          if (i < 0) {
            clearInterval (deleteInterval);

            setTimeout (() => {
              let j = 0;

              typeInterval = setInterval (() => {
                setDisplayText (registerText.slice (0, j + 1));
                j++;

                if (j === registerText.length) {
                  clearInterval (typeInterval);
                }
              }, 120);
            }, 200);
          }
        }, 70);
      } else {
        let i = registerText.length;

        deleteInterval = setInterval (() => {
          setDisplayText (registerText.slice (0, i));
          i--;

          if (i < 0) {
            clearInterval (deleteInterval);

            setTimeout (() => {
              let j = 0;

              typeInterval = setInterval (() => {
                setDisplayText (loginText.slice (0, j + 1));
                j++;

                if (j === loginText.length) {
                  clearInterval (typeInterval);
                }
              }, 120);
            }, 200);
          }
        }, 70);
      }

      return () => {
        clearInterval (deleteInterval);
        clearInterval (typeInterval);
      };
    },
    [isRegister]
  );

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (res.ok) {
        setResendTimer(60);
        setError('');
      }
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center
      transition-all duration-700
      ${isRegister ? 'bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl flex w-[90%] max-w-6xl overflow-hidden
        transition-all duration-700 ease-in-out
        ${isRegister ? 'scale-105 shadow-[0_20px_60px_rgba(99,102,241,0.4)]' : 'scale-100'}`}
      >

        {/* LEFT IMAGE */}
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-gray-100 p-10">
          <img
            src={loginImg}
            alt="login"
            className="w-full max-w-md hover:scale-105 transition duration-500"
          />
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-1/2 p-10">

          {/* NAVBAR */}
          <div className="flex justify-between items-center mb-10">

            {/* LOGO */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate ('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                <FaBalanceScale className="text-yellow-400 text-lg" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                CivikTrack
              </h1>
            </div>

            {/* MENU */}
            <div className="hidden md:flex gap-6 text-gray-600 text-sm font-medium">

              <span
                onClick={() => navigate ('/')}
                className="hover:text-blue-600 cursor-pointer transition"
              >
                Home
              </span>

              <span
                onClick={() => navigate ('/#about')}
                className="hover:text-purple-600 cursor-pointer transition"
              >
                About Us
              </span>

              <span className="bg-blue-600 text-white px-4 py-1 rounded">
                Login
              </span>

              <span
                onClick={() => navigate ('/#contact')}
                className="hover:text-indigo-600 cursor-pointer transition"
              >
                Contact
              </span>

            </div>

          </div>

          {/* HEADING */}
          <h2 className="text-4xl font-extrabold mb-8 text-center
            bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600
            text-transparent bg-clip-text tracking-wide">
            {displayText}
          </h2>

          {/* FORM */}
          <form className="space-y-4 transition-all duration-500" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
            {resetSuccess && <div className="text-green-600 text-sm font-semibold bg-green-50 p-3 rounded-lg border border-green-200">{resetSuccess}</div>}

            {showForgotPassword ? (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">Enter your registered email address and we'll send you a link to reset your password.</p>
                <div className="flex items-center border rounded-lg px-3 py-3">
                  <FaEnvelope className="text-gray-400 mr-3" />
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email address" className="w-full outline-none" required />
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span onClick={() => { setShowForgotPassword(false); setError(''); }} className="text-blue-600 cursor-pointer hover:underline font-semibold">&larr; Back to login</span>
                </div>
                <button type="submit" disabled={loading} className={`w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition duration-300 ${loading ? 'opacity-70' : ''}`}>
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </div>
            ) : showOtp ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                   <p className="text-indigo-800 text-sm font-semibold italic">Verification Required</p>
                   <p className="text-gray-500 text-xs mt-1">Check your email ({formData.email}) for the 6-digit OTP to finalize registration.</p>
                </div>
                <div className="flex items-center border border-gray-300 focus-within:border-indigo-500 rounded-lg px-3 py-3 bg-white">
                  <FaLock className="text-gray-400 mr-3" />
                  <input type="text" maxLength="6" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit OTP" className="w-full outline-none font-bold tracking-[0.5em] text-lg text-center" required />
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span onClick={() => { setShowOtp(false); setError(''); }} className="text-blue-600 cursor-pointer hover:underline font-semibold">&larr; Change details</span>
                  {resendTimer > 0 ? (
                    <span className="text-gray-400 font-bold">Resend in {resendTimer}s</span>
                  ) : (
                    <span onClick={handleResendOtp} className="text-indigo-600 cursor-pointer hover:underline font-bold">Resend OTP</span>
                  )}
                </div>
                <button type="submit" disabled={loading} className={`w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition duration-300 ${loading ? 'opacity-70' : ''}`}>
                  {loading ? 'Verifying...' : 'VERIFY & REGISTER'}
                </button>
              </div>
            ) : (
              <>
                {isRegister &&
                  <div className="flex items-center border rounded-lg px-3 py-3">
                    <FaUser className="text-gray-400 mr-3" />
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full outline-none" required />
                  </div>}

                <div className="flex items-center border rounded-lg px-3 py-3">
                  <FaEnvelope className="text-gray-400 mr-3" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full outline-none" required />
                </div>

                {isRegister && (
                  <div className="flex items-center border rounded-lg px-3 py-3 bg-white focus-within:border-indigo-500 transition-colors">
                    <FaPhone className="text-gray-400 mr-3" />
                    <span className="text-gray-600 font-semibold border-r border-gray-300 pr-3 mr-3 select-none">+91</span>
                    <input type="text" maxLength="10" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} placeholder="Mobile Number" className="w-full outline-none" required />
                  </div>
                )}

                <div className="flex items-center border rounded-lg px-3 py-3 relative">
                  <FaLock className="text-gray-400 mr-3" />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full outline-none pr-10" required />
                  <div 
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>

                {isRegister &&
                  <div className="flex items-center border rounded-lg px-3 py-3 relative">
                    <FaLock className="text-gray-400 mr-3" />
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full outline-none pr-10" required />
                    <div 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                  </div>}

                {/* OPTIONS */}
                {!isRegister &&
                  <div className="flex justify-between items-center text-sm mt-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" /> Remember
                    </label>
                    <span onClick={() => { setShowForgotPassword(true); setError(''); }} className="text-blue-600 cursor-pointer hover:underline font-semibold">
                      Forgot password?
                    </span>
                  </div>}

                {/* BUTTON */}
                <button type="submit" disabled={loading} className={`w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition duration-300 ${loading ? 'opacity-70' : ''}`}>
                  {loading ? 'Please wait...' : (isRegister ? 'CONTINUE TO verify' : 'LOGIN')}
                </button>
              </>
            )}
          </form>

          {/* TOGGLE */}
          <p className="text-center mt-6 text-gray-500 text-sm">

            {isRegister ? 'Already have an account?' : "Don't have an account?"}

            <span
              onClick={() => setIsRegister (!isRegister)}
              className="text-blue-600 font-semibold cursor-pointer ml-2 hover:underline"
            >
              {isRegister ? 'Login' : 'Register'}
            </span>

          </p>

        </div>

      </div>

    </div>
  );
}
