
    import React, { useEffect, useRef, useState } from 'react'
    import { useSearchParams } from 'react-router-dom'
    import userService from './UserService';
    import CommonTable from '../../components/commons/CommonTable';
    import { ButtonStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
    import { Divider, Input } from 'antd';
    import { searchUser, updateUserState, userSearchText } from './UserRedux';//** */
    import { useDispatch, useSelector } from 'react-redux'; /*** */

    
    const UserPick = ({setIsModalOpen,selectHandler}) => {
    const [userData, setUserData] = useState([])
    const [total, setTotal] = useState()
    const [searchParams,setSearchParams] = useSearchParams()
    const dispatch = useDispatch(); /*** */
    const searchText = useSelector(userSearchText); //** */
    
    
    const [loading, setLoading] = useState();
    const [userSelection, setUserSelection] = useState([])
    const delayTimerRef = useRef(null);
    
    const getPaginationInfo = () => {

        return [searchParams.get('page') || 1, searchParams.get('limit') || 5]
    }


    useEffect(() => {
        const [page, limit] = getPaginationInfo();
        dispatch(updateUserState({ page: page, limit: limit }))

        searchData();
    }, [])

    async function searchData() {
        try {
            setLoading(true)
            const { payload } = await dispatch(searchUser());
            setUserData(payload.data)
            setTotal(payload.total)
            setLoading(false)
        } catch (err) {
            setLoading(false)
        }
    }
    const searchHandler = (e) => {
        const { value } = e.target;
        const [page, limit] = getPaginationInfo();

        dispatch(updateUserState({ page: page, limit: limit, searchText: value }))
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = setTimeout(() => {


            searchData()
        }, 500);


    }

    const handlePagination = (page, pageSize) => {
        
        setSearchParams({page:page,limit:pageSize})
        searchData()
    }
    
    
     const columns = [
         
    
     
            {
                title: 'first_name',
                dataIndex: 'first_name',

            },
             
            {
                title: 'last_name',
                dataIndex: 'last_name',

            },
             
            {
                title: 'email',
                dataIndex: 'email',

            },
             
            {
                title: 'role',
                dataIndex: 'role',

            },
             
            {
                title: 'phone_number',
                dataIndex: 'phone_number',

            },
             
            {
                title: 'driver_license',
                dataIndex: 'driver_license',

            },
             
            {
                title: 'national_id',
                dataIndex: 'national_id',

            },
            
         
         ];
    
    
    
    
    return (

<div >
                <SearchInputStyle>
                    <Input onChange={searchHandler}
                        placeholder="Search"
                        value={searchText}
                        allowClear />
                </SearchInputStyle>


    <CommonTable
                rowSelectionType={"radio"}
                data={userData}
                columns={columns}
                setSelection={setUserSelection}
                handlePagination={handlePagination}
                total={total}
                loadding={loading}

            />
            <Divider style={{margin:15}}/>

<ButtonStyle>
     <button    onClick={()=>setIsModalOpen(false)} >
        cancel
      </button>
      <button disabled={userSelection.length==0} className={userSelection.length>0?'':'disable'} onClick={()=>selectHandler(userSelection[0])}>
        Return
      </button>
     </ButtonStyle>     

    </div>
  )
}
    
    

    export default UserPick
    