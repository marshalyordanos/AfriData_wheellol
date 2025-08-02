
    
import api from '../../api/api';

class BrandService {
    createBran(data) {
        return api
            .post("/brand", data)
            .then(response => {
                return response.data.data;
            });
    }

    updateBran(data, id) {
        return api
            .patch("/brand/" + id, data)
            .then(response => {
                return response.data.data;
            });
    }

    searchBran({page, limit,searchText=null,sort=null,order}) {
        let url = `/brand?page=${page}&limit=${limit}`
        if(sort){
    const sortValue = order == 'ascend' ? sort : order == 'descend' ? '-'+sort:'';
            url = url + `&sort=${sortValue}`
        }

        if(searchText){
           
            url = url + `&searchText=${searchText}`
        }

        return api
            .get(url)
            .then(response => {
                return {data:response.data.data,total:response.data.total};
            });
    }

    getBran(id) {
        return api
            .get("/brand/" + id)
            .then(response => {
                return response.data.data;
            });
    }


    deleteBran( id) {
        return api
            .delete("/brand/" + id)
            .then(response => {
                return response.data.data;
            });
    }

    brandDo({method,payload}){
        return api
            .post("/brand/do",{method,payload})
            .then(response => {
                return response.data.data;
            });
    }

    branDo({method,payload,id}){
        return api
            .post("/brand/do/"+id,{method,payload})
            .then(response => {
                return response.data.data;
            });
    }
}

export default new BrandService();

    