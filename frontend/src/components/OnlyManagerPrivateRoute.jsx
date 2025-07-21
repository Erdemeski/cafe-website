import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet, Navigate } from 'react-router-dom'


export default function OnlyManagerPrivateRoute() {

    const { currentUser } = useSelector((state) => state.user)

    return currentUser && currentUser.isManager ? (<Outlet />) : (<Navigate to='/dashboard-director' />);
}
