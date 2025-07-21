import React from 'react'
import { Link } from 'react-router-dom'
import custService from '../assets/home_page/customer_services.png'

export default function FooterBanner() {
    return (
        <div className="relative isolate overflow-hidden bg-gradient-to-t from-gray-300 dark:from-[rgb(41,48,53)] px-6 pb-6 pt-20 lg:px-8 shadow-sm">
            <div className="absolute bottom-0 -right-4 -z-10 transform-gpu overflow-hidden sm:bottom-0">
                <img src={custService} alt="Background" className="h-60 sm:h-72 object-contain" />
            </div>

            <div className="h-[230px] flex flex-col items-start justify-center lg:items-center pr-[150px] sm:pr-[200px] md:pr-0 dark:text-white gap-2 sm:gap-4">
                <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 dark:text-gray-50 sm:text-5xl">
                    Contact With Us!
                </h2>
                <p className="max-w-md text-gray-600 dark:text-gray-400 lg:text-center reduce_when_too_small hidden_when_too_small">
                    We are happy to answer your questions. You can contact us for support, information, and to make <span className='font-semibold text-gray-700 dark:text-gray-300'>special reservations.</span>
                </p>
                <Link to='/about'>
                    <button className="px-4 py-1 sm:py-1.5 text-lg font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:scale-105 transition-transform">
                        Contact Us
                    </button>
                </Link>
            </div>
        </div>
    )
}