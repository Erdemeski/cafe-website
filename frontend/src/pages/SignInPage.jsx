import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice.js';

export default function SignInPage() {

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { currentUser } = useSelector(state => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard-director');
    }
  }, [currentUser, navigate]);

  // formData veya sayfa yenilendiğinde error'ı temizle
  useEffect(() => {
    setErrorMessage("");
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    setErrorMessage(""); // input değişince error'ı gizle
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.password) {
      setErrorMessage('Please fill out all fields!');
      return;
    }

    // Validate staff ID format (6 digits)
    if (!/^\d{6}$/.test(formData.staffId)) {
      setErrorMessage('Staff ID must be 6 digits!');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success === false) {
        setErrorMessage(data.message);
        setLoading(false);
        return;
      }

      if (res.ok) {
        dispatch(signInSuccess(data));
        setLoading(false);
        navigate('/');
      }

    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen mt-20 relative isolate'>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
      >
        <div
          style={{
            clipPath:
              'polygon(55% 10%, 100% 30%, 100% 100%, 90% 30%, 85% 40%, 75% 35%, 65% 45%, 55% 40%, 45% 50%, 35% 45%, 25% 55%, 15% 50%, 5% 60%, 0% 55%, 0% 100%, 10% 90%, 20% 95%, 30% 85%, 40% 90%, 50% 80%, 60% 85%, 70% 75%, 80% 80%, 90% 70%, 100% 75%, 100% 100%, 0% 100%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-96 rotate-[300deg] bg-gradient-to-tr from-[#d528f7] to-[#0ed481] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
        />
      </div>
      <div className='flex flex-col items-center justify-center mb-10'>

        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 md:text-4xl">
          Staff Sign In Page
        </h2>
        <div className="flex justify-center my-4">
          <span className="inline-block w-24 h-1 rounded bg-gradient-to-r from-[#d528f7] to-[#0ed4ba] opacity-70"></span>
        </div>
        <div className="mt-5 flex justify-center"></div>
      </div>

      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        <div className='flex-1'>
          <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white focus:outline-none focus:ring-0'>
            <span className='ml-0 text-5xl font-semibold'>Erdem's <span className='bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text'>Cafe</span></span>
          </Link>
          <p className='text-sm mt-5'>
            To access the staff portal, please sign in with your staff ID and password.
          </p>
        </div>
        <div className='flex-1'>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div>
              <Label value='Your Staff ID' />
              <TextInput
                type='text'
                placeholder='123456'
                id='staffId'
                onChange={handleChange}
                maxLength={6}
                pattern="[0-9]{6}"
                title="Please enter a 6-digit staff ID"
                required
              />
            </div>
            <div className='mb-5'>
              <Label value='Your Password' />
              <TextInput
                type='password'
                placeholder='**********'
                id='password'
                onChange={handleChange}
                required
              />
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>{
              loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : 'Sign In'}
            </Button>
          </form>
          {/*           <div className='flex gap-2 text-sm mt-5'>
            <span>Don't have a staff account?</span>
            <Link to='/staff-sign-up' className='text-blue-500'>Contact Admin</Link>
          </div> */}
          {
            errorMessage && (
              <Alert className='my-5' color='failure'>
                {errorMessage}
              </Alert>
            )
          }
        </div>
      </div>
    </div>
  );
}
