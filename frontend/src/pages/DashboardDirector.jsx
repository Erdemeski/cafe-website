import React from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { Card } from 'flowbite-react';

export default function DashboardDirector() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen relative isolate bg-white dark:bg-[rgb(22,26,29)] px-4 py-16 sm:py-24 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
      >
        <div
          style={{
            clipPath:
              'polygon(85% 40%, 100% 55%, 100% 30%, 90% 10%, 85% 5%, 78% 25%, 65% 60%, 55% 70%, 50% 65%, 48% 35%, 30% 80%, 0% 70%, 20% 100%, 30% 78%, 80% 95%, 90% 110%, 95% 130%, 98% 145%, 100% 160%, 100% 200%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#f728a7] to-[#99d40e] opacity-30 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
        />
      </div>
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
          Dashboard Director
        </h2>
        <div className="flex justify-center my-4">
          <span className="inline-block w-24 h-1 rounded bg-gradient-to-r from-[#f728a7] to-[#99d40e] opacity-70"></span>
        </div>
        <div className="mt-5 flex justify-center"></div>
        <div className='flex flex-col gap-6 items-center'>
          {currentUser && (
            <div className="w-full flex flex-col items-center gap-8">
              <Card className='flex flex-col gap-3 items-center justify-center w-full max-w-md mx-auto p-6 shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300'>
                <div className='flex flex-col gap-2 items-center w-full'>
                  <div className='flex items-center gap-4 mb-2 w-full bg-gray-100 dark:bg-gray-700 rounded-xl p-3 shadow-sm'>
                    <img src={currentUser.profilePicture} alt="Profile" className='w-16 h-16 rounded-full object-cover border-4 border-[#858585] dark:border-[#c0c0c0] shadow-md' />
                    <div className='flex flex-col gap-1'>
                      <h2 className='text-xl font-bold text-gray-900 dark:text-gray-50'>{currentUser.firstName} {currentUser.lastName}</h2>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>Staff No: {currentUser.staffId}</p>
                    </div>
                  </div>
                  <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mt-2'>Permissions</h2>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {currentUser.isAdmin && <span className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">Admin User <span className='text-xl'>🧑‍💻</span></span>}
                    {currentUser.isWaiter && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">Waiter User <span className='text-xl'>🤵</span></span>}
                    {currentUser.isManager && <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">Manager User <span className='text-xl'>💼</span></span>}
                    {currentUser.isReception && <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">Reception User <span className='text-xl'>💁</span></span>}
                    {!currentUser.isAdmin && !currentUser.isWaiter && !currentUser.isManager && !currentUser.isReception && <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">Undefined User <span className='text-xl'>👤</span></span>}
                  </div>
                </div>
              </Card>

              <div className='w-full flex justify-center mt-2'>
                <div className='flex flex-wrap justify-center gap-6 transition-all duration-700 ease-in-out will-change-transform'>
                  {currentUser.isAdmin && (
                    <Card onClick={() => navigate('/admin-dashboard')} className='flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900 rounded-2xl hover:scale-105 transition-all duration-300 shadow-md border border-pink-200 dark:border-pink-700 py-8 w-[200px] transform ease-in-out will-change-transform animate-bounceIn'>
                      <span className="text-3xl mb-2">🧑‍💻</span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">Admin Dashboard</h3>
                    </Card>
                  )}
                  {currentUser.isManager && (
                    <Card onClick={() => navigate('/manager-dashboard')} className='flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 rounded-2xl hover:scale-105 transition-all duration-300 shadow-md border border-green-200 dark:border-green-700 py-8 w-[200px] transform ease-in-out will-change-transform animate-bounceIn'>
                      <span className="text-3xl mb-2">💼</span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">Manager Dashboard</h3>
                    </Card>
                  )}
                  {currentUser.isWaiter && (
                    <Card onClick={() => navigate('/waiter-dashboard')} className='flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded-2xl hover:scale-105 transition-all duration-300 shadow-md border border-blue-200 dark:border-blue-700 py-8 w-[200px] transform ease-in-out will-change-transform animate-bounceIn'>
                      <span className="text-3xl mb-2">🤵</span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">Waiter Dashboard</h3>
                    </Card>
                  )}
                  {currentUser.isReception && (
                    <Card onClick={() => navigate('/reception-dashboard')} className='flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-2xl hover:scale-105 transition-all duration-300 shadow-md border border-yellow-200 dark:border-yellow-700 py-8 w-[200px] transform ease-in-out will-change-transform animate-bounceIn'>
                      <span className="text-3xl mb-2">💁</span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">Reception Dashboard</h3>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}