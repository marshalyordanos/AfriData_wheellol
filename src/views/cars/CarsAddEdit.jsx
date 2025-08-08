
    
import React, { useEffect, useState } from 'react'
import { Button, Divider, Dropdown, Form, Input, InputNumber, Select, Spin, Switch,DatePicker } from 'antd';
import styled from 'styled-components';
import { ButtonStyle, FlexStyle, FormStyle } from '../../components/commons/CommonStyles';
import carsService from './CarsService';
import CommonModal from '../../components/commons/CommonModel';
import CarsPick from './CarsPick';
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
    
    
    
    const CarsEdit = ({setIsModalOpen,isModelOpen,mode,setMode,carsData,searchData}) => {
      const [carsData2, setCarsData2] = useState([])

      const [form] = Form.useForm();
      const [switch2,setSwitch2] = useState("")
      const [loading,setLoading] = useState("")
      const [carPick,setCarPick] = useState(false)


    
    useEffect(()=>{
        const featchData = async()=>{
        try{

            const data = await carsService.getCar(mode);
            form.setFieldsValue({ car: {...data,updatedAt:dayjs(data.updatedAt)} });
            
    
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

    const carPickHandler=(data)=>{
        console.log('carPickHandler',data)
        
        setCarPick(false)
        
    }


    const onAdd = async(e)=>{
      e.preventDefault();
        try{

        setLoading(true);

        const data = await carsService.carsDo({method:'add_list_to_car',payload:{data:carsData2}})
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

        const data = await carsService.updateCar(datas.car,mode)
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
      setCarsData2([{...form.getFieldsValue()?.car,_id:new Date().getTime()},...carsData2])
      handleReset()
    }
    
    
    const onClick = ({ key }, record) => {
      if (key == 'edit') {
        console.log("========",record)

        form.setFieldsValue({car:record})
        const data = carsData2.filter((car)=>car._id !== record._id)
        setCarsData2(data)

      } else if (key === 'delete') {
        console.log("========",record)
          const data = carsData2.filter((car)=>car._id !== record._id)
          setCarsData2(data)
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
                title: 'title',
                dataIndex: 'title',

            },
             
            {
                title: 'brand',
                dataIndex: 'brand',

            },
             
            {
                title: 'model',
                dataIndex: 'model',

            },
             
            {
                title: 'year',
                dataIndex: 'year',

            },
             
            {
                title: 'is_featured',
                dataIndex: 'is_featured',
                render: (text, recored) => {
                    return recored.is_featured ? <p>true</p> : <p>false</p>
                },
            },
             
            {
                title: 'category',
                dataIndex: 'category',

            },
             
            {
                title: 'transmission',
                dataIndex: 'transmission',

            },
             
            {
                title: 'fuel_type',
                dataIndex: 'fuel_type',

            },
             
            {
                title: 'seating_capacity',
                dataIndex: 'seating_capacity',

            },
             
            {
                title: 'rental_price_per_day',
                dataIndex: 'rental_price_per_day',

            },
             
            {
                title: 'location',
                dataIndex: 'location',

            },
             
            {
                title: 'description',
                dataIndex: 'description',

            },
             
            {
                title: 'images',
                dataIndex: 'images',

            },
             
            {
                title: 'insurance_info',
                dataIndex: 'insurance_info',

            },
             
            {
                title: 'rental_terms',
                dataIndex: 'rental_terms',

            },
            
         
         ];
    
    
  
  
  
    return (
    <div>
      {/*******  picks **********/}
      {carPick ? <CommonModal
        width={700}
        isModalOpen={carPick}
        setIsModalOpen={setCarPick}
      >
        <CarsPick
          setIsModalOpen={setCarPick}
          selectHandler={carPickHandler}
        />
      </CommonModal> : ""}


      {loading ? <SpinStyle>
        <Spin style={{ color: "#fff" }} size="large" />
      </SpinStyle> : ""}
      <button onClick={() => setCarPick(true)}>hhhhhh</button>
      
      
      
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
            name={['car', 'title']}
            label="title"
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
            name={['car', 'brand']}
            label="brand"
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
            name={['car', 'model']}
            label="model"
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
            name={['car', 'year']}
            label="year"
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
            
                <Form.Item name={['car', 'is_featured']} label="is_featured" >
                    <Switch checked={switch2} onChange={(value)=>setSwitch2(value)} style={{background:switch2?'blue':'gray'}} />
                </Form.Item>
            
            <Form.Item
            className=' flex-1'
            name={['car', 'category']}
            label="category"
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
            name={['car', 'transmission']}
            label="transmission"
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
            name={['car', 'fuel_type']}
            label="fuel_type"
            className=' flex-1'
            rules={[
              {
                required: true,
                message: 'Please select fuel_type!',
              },
            ]}
          >
            <Select
              className='border-gray-400 '
              placeholder="select your fuel_type">
              <Option value="value1">Value1</Option>
              <Option value="value2">Value2</Option>
            </Select>
          </Form.Item>
            
            <Form.Item
      
            name={['car', 'seating_capacity']}
            label="seating_capacity"
            rules={[
            {
                type: 'number',
                min: 0,
                max: 99,
            },

            ]}
            
            >
            <InputNumber 
            className='border-gray-400 py-1'
            style={{
                minWidth:150
            }} 
            />
            </Form.Item>
                    
            <Form.Item
      
            name={['car', 'rental_price_per_day']}
            label="rental_price_per_day"
            rules={[
            {
                type: 'number',
                min: 0,
                max: 99,
            },

            ]}
            
            >
            <InputNumber 
            className='border-gray-400 py-1'
            style={{
                minWidth:150
            }} 
            />
            </Form.Item>
                    
            <Form.Item
            className=' flex-1'
            name={['car', 'location']}
            label="location"
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
            name={['car', 'description']}
            label="description"
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
            name={['car', 'images']}
            label="images"
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
            name={['car', 'insurance_info']}
            label="insurance_info"
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
            name={['car', 'rental_terms']}
            label="rental_terms"
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
            
      
      
    {carsData2.length>0 && <CommonTable
                    rowSelectionType={"checkbox"}
                    data={carsData2}
                    columns={columns}
                    total={carsData2.lenght}
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

          {!mode&&<button disabled={carsData2.length==0} onClick={onAdd} className={carsData2.length>0?"":'disable'} type='submit'  >
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



export default CarsEdit
    
    