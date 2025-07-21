import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import { FaInfoCircle } from 'react-icons/fa';

export default function SignUpPage() {

  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { currentUser } = useSelector(state => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard-director');
    }
  }, [currentUser, navigate]);

  const validateForm = () => {
    const errors = {};

    if (formData.staffId && !/^\d{6}$/.test(formData.staffId)) {
      errors.staffId = 'Staff ID must be exactly 6 digits';
    }

    if (formData.firstName && formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }
    if (formData.lastName && formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.firstName || !formData.lastName || !formData.password) {
      return setErrorMessage('Please fill out all fields!');
    }
    if (!validateForm()) {
      return setErrorMessage('Please fix the validation errors');
    }
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success === false) {
        return setErrorMessage(data.message);
      }

      setLoading(false);

      if (res.ok) {
        navigate('/staff-sign-in');
      }

    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  const generateStaffId = () => {
    const staffId = Math.floor(Math.random() * 900000) + 100000;
    setFormData({ ...formData, staffId: staffId.toString() });
  };

  const generateStaffPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: password });
  };

  return (
    <div className='min-h-screen mt-20 relative isolate'>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0 rotate-180"
      >
        <div
          style={{
            clipPath:
              'polygon(5% 10%, 100% 30%, 100% 100%, 50% 30%, 5% 40%, 5% 35%, 5% 45%, 55% 40%, 5% 0%, 35% 45%, 25% 55%, 15% 50%, 95% 60%, 0% 55%, 0% 100%, 10% 90%, 20% 95%, 30% 85%, 40% 90%, 50% 80%, 60% 85%, 70% 75%, 80% 80%, 200% 70%, 10% 75%, 100% 100%, 0% 100%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/4 rotate-[25deg] bg-gradient-to-tr from-[#f728db] to-[#0adabe] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
        />
      </div>
      <div className='flex flex-col items-center justify-center mb-10'>

        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 md:text-4xl">
          Staff Create Page
        </h2>
        <div className="flex justify-center my-4">
          <span className="inline-block w-24 h-1 rounded bg-gradient-to-r from-[#f728db] to-[#0adabe] opacity-70"></span>
        </div>
        <div className="mt-5 flex justify-center"></div>
      </div>

      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>

        <div className='flex-1'>
          <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white focus:outline-none focus:ring-0'>
            <span className='ml-0 text-5xl font-semibold'>Erdem's <span className='bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text'>Cafe</span></span>
          </Link>
          <p className='text-sm mt-5'>
            Create a new staff account for the cafe management system.
          </p>
        </div>
        <div className='flex-1'>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div className='flex gap-4 w-full'>
              <div className='w-1/2'>
                <Label value='Staff First Name' />
                <TextInput
                  type='text'
                  placeholder='First name'
                  id='firstName'
                  onChange={handleChange}
                  required
                />
                {validationErrors.firstName && (
                  <span className='text-red-500 text-sm'>{validationErrors.firstName}</span>
                )}
              </div>
              <div className='w-1/2'>
                <Label value='Staff Last Name' />
                <TextInput
                  type='text'
                  placeholder='Last name'
                  id='lastName'
                  onChange={handleChange}
                  required
                />
                {validationErrors.lastName && (
                  <span className='text-red-500 text-sm'>{validationErrors.lastName}</span>
                )}
              </div>
            </div>
            <div className='flex flex-col w-full'>
              <Label value='Staff ID' />
              <div className='flex gap-1 w-full items-center'>
                <div className='w-full'>
                  <TextInput
                    type='text'
                    placeholder='123456'
                    id='staffId'
                    onChange={handleChange}
                    required
                    value={formData.staffId}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    title="Please enter a 6-digit staff ID"
                  />
                </div>
                <div className='w-1/5'>
                  <Button color='gray' size='sm' className='w-full' onClick={generateStaffId}>
                    Generate
                  </Button>
                </div>
              </div>
              {validationErrors.staffId && (
                <span className='text-red-500 text-sm'>{validationErrors.staffId}</span>
              )}
            </div>
            <div className='flex flex-col w-full mb-3'>
              <Label value='Staff Password' />
              <div className='flex gap-1 w-full items-center'>
                <div className='w-full'>
                  <TextInput
                    type='text'
                    placeholder='**********'
                    id='password'
                    onChange={handleChange}
                    required
                    value={formData.password}
                  />
                </div>
                <div className='w-1/5'>
                  <Button color='gray' size='sm' className='w-full' onClick={generateStaffPassword}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            <span className='flex items-center text-sm text-gray-500'>
              <FaInfoCircle className='w-8 h-8 mr-2 text-gray-500' />
              Staff permissions are managed by administrators only. Contact the admin to set up proper access levels.
            </span>

            <div className=''>
              {validationErrors.password && (
                <span className='text-red-500 text-sm'>{validationErrors.password}</span>
              )}
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>{
              loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : 'Create Staff Account'}
            </Button>
          </form>
          <div className='flex gap-2 text-sm mt-5'>
            <span>Already have a staff account?</span>
            <Link to='/staff-sign-in' className='text-blue-500'>Sign In</Link>
          </div>
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
