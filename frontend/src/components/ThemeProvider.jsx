import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

export default function ThemeProvider({ children }) {
    const { theme } = useSelector((state) => state.theme)
    const metaThemeColorRef = useRef(null)
    
    useEffect(() => {
        const root = document.documentElement
        
        if (root.style.colorScheme !== theme) {
            root.style.colorScheme = theme
        }
        
        if (!metaThemeColorRef.current) {
            let metaThemeColor = document.querySelector('meta[name="theme-color"]')
            if (!metaThemeColor) {
                metaThemeColor = document.createElement('meta')
                metaThemeColor.name = 'theme-color'
                document.head.appendChild(metaThemeColor)
            }
            metaThemeColorRef.current = metaThemeColor
        }
        
        const newColor = theme === 'dark' ? '#161a1d' : '#ffffff'
        if (metaThemeColorRef.current.content !== newColor) {
            metaThemeColorRef.current.content = newColor
        }
        
        const currentColorScheme = root.style.getPropertyValue('color-scheme')
        if (currentColorScheme !== theme) {
            root.style.setProperty('color-scheme', theme, 'important')
        }
        
    }, [theme])
    
    return (
        <div className={theme}>
            <div className='bg-white text-gray-700 dark:text-gray-200 dark:bg-[rgb(22,26,29)] min-h-screen'>
                {children}
            </div>
        </div>
    )
}
