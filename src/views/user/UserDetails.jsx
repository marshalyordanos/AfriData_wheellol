import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button, Spin, Tag, Divider, message, Image } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import UserService from './UserService';

const UserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

 const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      const userData = await UserService.getUser(userId);
      setUser(userData);
    } catch (error) {
      message.error("Failed to fetch user details.");
      navigate('/dash/users');
    } finally {
      setLoading(false);
    }
  };

   const handleApprove = async () => {
    try {
      await UserService.userAction('approve', id);
      message.success(`User ${user.first_name} has been approved.`);
      fetchUserData(id);
    } catch (error) {
      message.error("Failed to approve user.");
    }
  };
  
  const handleReject = async () => {
    try {
      await UserService.userAction('reject', id);
      message.warning(`User ${user.first_name} has been rejected.`);
      fetchUserData(id);
    } catch (error) {
      message.error("Failed to reject user.");
    }
  };
  
  if (loading) {
    return <div className="p-10 text-center"><Spin size="large" /></div>;
  }

  if (!user) {
    return <div className="p-10">User not found.</div>;
  }

  const renderRoleTag = (role) => {
    const colors = { admin: 'gold', car_owner: 'blue', renter: 'green' };
    return <Tag color={colors[role] || 'default'}>{role?.toUpperCase()}</Tag>;
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dash/users')} />
            <h1 className="text-2xl font-bold ml-4">User Details</h1>
        </div>
        <div>
            <Link to={`/dash/users/edit/${user._id}`}>
                <Button icon={<EditOutlined />} type="primary">Edit User</Button>
            </Link>
        </div>
      </div>
      
      <DetailStyle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className='detail_child'><p className='detail_key'>Full Name:</p><p className='detail_value'>{user.first_name} {user.last_name}</p></div>
            <div className='detail_child'><p className='detail_key'>Email:</p><p className='detail_value'>{user.email}</p></div>
            <div className='detail_child'><p className='detail_key'>Phone Number:</p><p className='detail_value'>{user.phone_number}</p></div>
            <div className='detail_child'><p className='detail_key'>Role:</p><div className='detail_value'>{renderRoleTag(user.role)}</div></div>
            <div className='detail_child'><p className='detail_key'>Status:</p><div className='detail_value'><Tag>{user.status}</Tag></div></div>
          </div>
          {/* Profile Picture */}
          <div className="col-span-1 flex flex-col items-center">
             <Image width={150} src={user.profile_picture} alt="Profile" className="rounded-full" />
             <p className="mt-2 text-gray-500">Profile Picture</p>
          </div>
        </div>
        
        {/* Verification Section */}
        {user.role === 'car_owner' && (user.driver_license || user.national_id) && (
            <>
                <Divider />
                <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {user.driver_license && <div><p className="font-semibold mb-2">Drivers License</p><Image width={300} src={user.driver_license} /></div>}
                    {user.national_id && <div><p className="font-semibold mb-2">National ID</p><Image width={300} src={user.national_id} /></div>}
                </div>
                {user.status === 'Pending Verification' && (
                    <div className="flex gap-4">
                        <Button icon={<CheckCircleOutlined />} type="primary" onClick={handleApprove}>Approve Verification</Button>
                        <Button icon={<CloseCircleOutlined />} danger onClick={handleReject}>Reject</Button>
                    </div>
                )}
            </>
        )}
      </DetailStyle>
    </div>
  );
};

const DetailStyle = styled.div`
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .detail_child {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .detail_key {
    font-weight: 600;
    color: #555;
    width: 150px; 
  }
  .detail_value {
    color: #111;
  }
`;

export default UserDetails;