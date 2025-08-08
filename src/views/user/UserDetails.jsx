
    import { Divider } from 'antd'
    import React from 'react'
    import { useLocation } from 'react-router-dom'
    import styled from 'styled-components'


    
    const UserDetail = () => {
    const {state} = useLocation();
    return (
    <DetailStyle>
        <h1>User Detail</h1>
        <Divider  style={{margin:'15px 0 25px 0'}} />

    
    
    
                <div className='detail_child'>
                <p className='detail_key'>first_name:</p>
                <p className='detail_value'>{state?.first_name}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>last_name:</p>
                <p className='detail_value'>{state?.last_name}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>email:</p>
                <p className='detail_value'>{state?.email}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>role:</p>
                <p className='detail_value'>{state?.role}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>phone_number:</p>
                <p className='detail_value'>{state?.phone_number}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>driver_license:</p>
                <p className='detail_value'>{state?.driver_license}</p>  
            </div>
            
                <div className='detail_child'>
                <p className='detail_key'>national_id:</p>
                <p className='detail_value'>{state?.national_id}</p>  
            </div>
            

    </DetailStyle>
  )
}
    


    const DetailStyle = styled.div`
        border: 1px lightgray;
        margin: 30px;
        padding: 20px;
        background-color: white;
        border-radius: 8px;
        h1{
            padding: 0;
            margin: 0;
            font-size: 16px;

        }
        .detail_child{
            margin-bottom: 15px;
        }
        .detail_key{
            font-size: 20px;
            font-weight: bold;
        }
        .detail_value{
            color: #106085;
            font-size: 20px;
        }

`

export default UserDetail
    