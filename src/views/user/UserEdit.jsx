
    import React, { useEffect, useState } from 'react'
    import { Button, Form, Input, InputNumber, Select, Spin, Switch,DatePicker,Divider } from 'antd';
    import styled from 'styled-components';
    import { ButtonStyle, FlexStyle, FormStyle } from '../../components/commons/CommonStyles';
    import userService from './UserService';
    import CommonModal from '../../components/commons/CommonModel';
    import UserPick from './UserPick';
    import dayjs from 'dayjs';
    
    const { Option } = Select;

    const validateMessages = {
    required: '${label} is required!',
    types: {
        email: '${label} is not a valid email!',
        number: '${label} is not a valid number!',
    },
    number: {
        range: '${label} must be between ${min} and ${max}',
    },
    };
    
    const UserEdit = ({setIsModalOpen,isModelOpen,mode,setMode,userData,searchData}) => {
    const [form] = Form.useForm();
    const [switch2,setSwitch2] = useState("")
    const [loading,setLoading] = useState("")
    const [usePick,setUsePick] = useState(false)


    
    useEffect(()=>{
        const featchData = async()=>{
        try{

            const data = await userService.getUse(mode);
            form.setFieldsValue({ use: {...data,updatedAt:dayjs(data.updatedAt)} });
            
    
        }catch(err){
        }
        }
        if (mode==''){
        
        } else{
        
        featchData()
        }
    },[])


    const handleReset = () => {
        form.resetFields(); // Reset form fields
    }; 

    const usePickHandler=(data)=>{
        console.log('usePickHandler',data)
        
        setUsePick(false)
        
    }


    const onAdd = async(datas)=>{
        try{

        setLoading(true);

        const data = await userService.createUse(datas.use)
        setIsModalOpen(false)
        searchData()

        setLoading(false);

        }catch(err){
        setLoading(false);
        }
    } 

    const onUpdate = async(datas)=>{
        
        try{

        setLoading(true);

        const data = await userService.updateUse(datas.use,mode)
        searchData()
        setIsModalOpen(false)
        setLoading(false);

        }catch(err){
        setLoading(false);
        }
    } 
    

    const onFinish = (values) => {
        mode == ''? onAdd(values):onUpdate(values)
    };
    
    
    
        return (
    <div>
      {/*******  picks **********/}
      {usePick ? <CommonModal
        width={700}
        isModalOpen={usePick}
        setIsModalOpen={setUsePick}
      >
        <UserPick
          setIsModalOpen={setUsePick}
          selectHandler={usePickHandler}
        />
      </CommonModal> : ""}


      {loading ? <SpinStyle>
        <Spin style={{ color: "#fff" }} size="large" />
      </SpinStyle> : ""}
      <button onClick={() => setUsePick(true)}>hhhhhh</button>
      
      
    <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
        onError={() => { } }

        validateMessages={validateMessages}
      >
      

    
            <Form.Item
            className=' flex-1'
            name={['use', 'first_name']}
            label="first_name"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'last_name']}
            label="last_name"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'email']}
            label="email"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'role']}
            label="role"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'phone_number']}
            label="phone_number"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'driver_license']}
            label="driver_license"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['use', 'national_id']}
            label="national_id"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='border-gray-400 py-2'
            />
            </Form.Item>
            
      
      <ButtonStyle>
          <button onClick={() => setIsModalOpen(false)} >
            cancel
          </button>
          <button type="submit" >
            Submit
          </button>
        </ButtonStyle>
      </FormStyle>
      
    
      </div>
  )
      
      
      
    
   }  
   
   
  const SpinStyle = styled.div`
  /* border: 1px solid; */
  width: 50px;
  height:  50px;
  background-color: rgba(0,0,0,0.2);
  z-index: 100;
  display: flex;
  border-radius:  120px;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 40%;

  .ant-spin-dot .ant-spin-dot-spin {
    background-color: red; 
  }
 


`



export default UserEdit
    