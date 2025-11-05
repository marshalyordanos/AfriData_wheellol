
    
import React, { useEffect, useState } from 'react'
import { Button, Divider, Dropdown, Form, Input, InputNumber, Select, Spin, Switch,DatePicker } from 'antd';
import styled from 'styled-components';
import { ButtonStyle, FlexStyle, FormStyle } from '../../components/commons/CommonStyles';
import cartypesService from './CartypesService';
import CommonModal from '../../components/commons/CommonModel';
import CartypesPick from './CartypesPick';
import dayjs from 'dayjs';
import CommonTable from '../../components/commons/CommonTable';
import {
  MoreOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { NavLink } from 'react-router-dom';
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
    
    
    
    const CartypesEdit = ({setIsModalOpen,isModelOpen,mode,setMode,cartypesData,searchData}) => {
      const [cartypesData2, setCartypesData2] = useState([])

      const [form] = Form.useForm();
      const [switch2,setSwitch2] = useState("")
      const [loading,setLoading] = useState("")
      const [cartypePick,setCartypePick] = useState(false)


    
    useEffect(()=>{
        const featchData = async()=>{
        try{

            const data = await cartypesService.getCartype(mode);
            form.setFieldsValue({ cartype: {...data,updatedAt:dayjs(data.updatedAt)} });
            
    
        }catch(err){
        }
        }
        if (mode==''){
        
        } else{
        
        featchData()
        }
    },[])


    const handleReset = () => {
        form.resetFields();
    }; 

    const cartypePickHandler=(data)=>{
        console.log('cartypePickHandler',data)
        
        setCartypePick(false)
        
    }


    const onAdd = async(e)=>{
      e.preventDefault();
        try{

        setLoading(true);

        const data = await cartypesService.cartypesDo({method:'add_list_to_cartype',payload:{data:cartypesData2}})
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

        const data = await cartypesService.updateCartype(datas.cartype,mode)
        searchData()
        setIsModalOpen(false)
        setLoading(false);

        }catch(err){
        setLoading(false);
        }
    }
    

    const onFinish = (values) => {
      console.log("===========")
        mode == ''? handleAddToList(values):onUpdate(values)
    };
    const handleAddToList = (e)=>{
      // e.preventDefault()
      setCartypesData2([{...form.getFieldsValue()?.cartype,_id:new Date().getTime()},...cartypesData2])
      handleReset()
    }
    
    
    const onClick = ({ key }, record) => {
      if (key == 'edit') {
        console.log("========",record)

        form.setFieldsValue({cartype:record})
        const data = cartypesData2.filter((cartype)=>cartype._id !== record._id)
        setCartypesData2(data)

      } else if (key === 'delete') {
        console.log("========",record)
          const data = cartypesData2.filter((cartype)=>cartype._id !== record._id)
          setCartypesData2(data)
      }
  };
    const items = [
      {
          key: 'edit',
          label: (
              <Button type="text">Edit</Button>
          ),


      },
      {
          key: 'delete',
          label: (
              <Button type="text"> Delete</Button>
          ),
      },
      {
          key: '3',
          label: (
              <a target="_blank" rel="noopener noreferrer" href="https://www.luohanacademy.com">
                  3rd menu item
              </a>
          ),
      },
  ];
  
     const columns = [
         
    
     
            {
                title: 'name',
                dataIndex: 'name',

            },
             
            {
                title: 'active',
                dataIndex: 'active',
                render: (text, recored) => {
                    return recored.active ? <p>true</p> : <p>false</p>
                },
            },
            
         
         ];
    
    
  
  
  
    return (
    <div>
      {/*******  picks **********/}
      {cartypePick ? <CommonModal
        width={700}
        isModalOpen={cartypePick}
        setIsModalOpen={setCartypePick}
      >
        <CartypesPick
          setIsModalOpen={setCartypePick}
          selectHandler={cartypePickHandler}
        />
      </CommonModal> : ""}


      {loading ? <SpinStyle>
        <Spin style={{ color: "#fff" }} size="large" />
      </SpinStyle> : ""}
      <button onClick={() => setCartypePick(true)}>hhhhhh</button>
      
      
      
    <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
        onError={() => {} }

        validateMessages={validateMessages}
      >
      
      

        
            <Form.Item
            className=' flex-1'
            name={['cartype', 'name']}
            label="name"
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
            
                <Form.Item name={['cartype', 'active']} label="active" >
                    <Switch checked={switch2} onChange={(value)=>setSwitch2(value)} style={{background:switch2?'blue':'gray'}} />
                </Form.Item>
            
      
      
    {cartypesData2.length>0 && <CommonTable
                    rowSelectionType={"checkbox"}
                    data={cartypesData2}
                    columns={columns}
                    total={cartypesData2.lenght}
                    loadding={loading}
                    type={true}

                />}

                <Divider/>
            
      
      <ButtonStyle>
          <button onClick={() => setIsModalOpen(false)} >
            cancel
          </button>

          {mode?<button type='submit'  >
           Submit
          </button>:<button type='submit'  >
            Add List
          </button>}

          {!mode&&<button disabled={cartypesData2.length==0} onClick={onAdd} className={cartypesData2.length>0?"":'disable'} type='submit'  >
            Submit
          </button>}
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



export default CartypesEdit
    
    