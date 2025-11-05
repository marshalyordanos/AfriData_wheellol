
    import React, { useEffect, useRef, useState } from 'react'
    import { useSearchParams } from 'react-router-dom'
    import cartypesService from './CartypesService';
    import CommonTable from '../../components/commons/CommonTable';
    import { ButtonStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
    import { Divider, Input } from 'antd';
    import { searchCartypes, updateCartypesState, cartypesSearchText } from './CartypesRedux';//** */
    import { useDispatch, useSelector } from 'react-redux'; /*** */

    
    const CartypesPick = ({setIsModalOpen,selectHandler}) => {
    const [cartypesData, setCartypesData] = useState([])
    const [total, setTotal] = useState()
    const [searchParams,setSearchParams] = useSearchParams()
    const dispatch = useDispatch(); /*** */
    const searchText = useSelector(cartypesSearchText); //** */
    
    
    const [loading, setLoading] = useState();
    const [cartypesSelection, setCartypesSelection] = useState([])
    const delayTimerRef = useRef(null);
    
    const getPaginationInfo = () => {

        return [searchParams.get('page') || 1, searchParams.get('limit') || 5]
    }


    useEffect(() => {
        const [page, limit] = getPaginationInfo();
        dispatch(updateCartypesState({ page: page, limit: limit }))

        searchData();
    }, [])

    async function searchData() {
        try {
            setLoading(true)
            const { payload } = await dispatch(searchCartypes());
            setCartypesData(payload.data)
            setTotal(payload.total)
            setLoading(false)
        } catch (err) {
            setLoading(false)
        }
    }
    const searchHandler = (e) => {
        const { value } = e.target;
        const [page, limit] = getPaginationInfo();

        dispatch(updateCartypesState({ page: page, limit: limit, searchText: value }))
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

<div >
                <SearchInputStyle>
                    <Input onChange={searchHandler}
                        placeholder="Search"
                        value={searchText}
                        allowClear />
                </SearchInputStyle>


    <CommonTable
                rowSelectionType={"radio"}
                data={cartypesData}
                columns={columns}
                setSelection={setCartypesSelection}
                handlePagination={handlePagination}
                total={total}
                loadding={loading}

            />
            <Divider style={{margin:15}}/>

<ButtonStyle>
     <button    onClick={()=>setIsModalOpen(false)} >
        cancel
      </button>
      <button disabled={cartypesSelection.length==0} className={cartypesSelection.length>0?'':'disable'} onClick={()=>selectHandler(cartypesSelection[0])}>
        Return
      </button>
     </ButtonStyle>     

    </div>
  )
}
    
    

    export default CartypesPick
    