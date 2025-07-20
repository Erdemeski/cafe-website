import React from 'react'

export default function AdvCardSkeleton() {
    return (
        <div className='w-full sm:w-[430px] h-[400px] rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-gray-800 shadow-md animate-pulse overflow-hidden'>
            <div className='h-[260px] w-full bg-gray-200 dark:bg-gray-700'></div>
            <div className='p-3 flex flex-col gap-2 blur-[7px]'>
                <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-11/12'></div>
                <div className='flex justify-between items-center mt-10'>
                    <div className='h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded'></div>
                    <div className='flex gap-1 items-end'>
                        <div className='h-6 w-5 bg-gray-200 dark:bg-gray-700 rounded'></div>
                        <div className='h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded'></div>
                        <span className="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400 blur-[3px]">/person</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
