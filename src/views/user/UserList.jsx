import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, message } from "antd";
import { NavLink, useSearchParams } from "react-router-dom";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  updateUserQuery,
  selectAllUsers,
  selectUserTotal,
  selectUserStatus,
  selectUserQuery
} from "./UserRedux";

const UserList = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);

  const userData = useSelector(selectAllUsers);
  const totalUsers = useSelector(selectUserTotal);
  const status = useSelector(selectUserStatus);
  const query = useSelector(selectUserQuery);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

   const searchHandler = (e) => {
    const { value } = e.target;
    clearTimeout(delayTimerRef.current);
    
    // Update the query in Redux state
    dispatch(updateUserQuery({ searchText: value, page: 1 }));
    setSearchParams({ page: 1, limit: query.limit, searchText: value });

    delayTimerRef.current = setTimeout(() => {
      dispatch(fetchUsers());
    }, 500); // Debounce search requests
  };

  const handlePagination = (page, pageSize) => {
    setSearchParams({ page, limit: pageSize });
    dispatch(updateUserQuery({ page, limit: pageSize }));
    dispatch(fetchUsers());
  };

  const tableChangeHandler = (pagination, filters, sorter) => {
    const { field, order } = sorter;
    dispatch(updateUserQuery({ sort: field, order: order }));
    dispatch(fetchUsers());
  };

  const handleReload = () => {
    dispatch(updateUserQuery({ searchText: '', page: 1, limit: 10, sort: '', order: '' }));
    setSearchParams({ page: 1, limit: 10 });
    dispatch(fetchUsers());
  };

  // 5. Implement the real delete handler
  const handleDelete = async () => {
    // We don't need a local loading state; the Redux status will handle it.
    const resultAction = await dispatch(deleteUser(selectedUserId));
    if (deleteUser.fulfilled.match(resultAction)) {
      message.success("User deleted successfully!");
      setIsDeleteModalOpen(false);
      // The user is removed from the list automatically by the reducer, no need to refetch.
    } else {
      message.error("Failed to delete user.");
    }
  };
  
  const onMenuClick = ({ key }, record) => {
    setSelectedUserId(record._id);
    if (key === "delete") {
      setIsDeleteModalOpen(true);
    }
  };


  const menuItems = [{ key: "delete", label: <Button type="text" danger>Delete</Button> }];

  const columns = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      sorter: true,
      render: (text, record) => (
        <NavLink style={{ color: "#2f1dca" }} to={`/dash/users/${record._id}`}>
          {text}
        </NavLink>
      ),
    },
    { title: "Email", dataIndex: "email", sorter: true },
    { title: "Role", dataIndex: "role", sorter: true },
    { title: "Status", dataIndex: "status", sorter: true },
    {
      title: "Actions",
      dataIndex: "action",
      render: (_, record) => (
        <Dropdown
          menu={{ items: menuItems, onClick: (value) => onMenuClick(value, record) }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={status === 'loading'}
          isModalOpen={isDeleteModalOpen}
        >
          <h1 className="text-2xl">Are you sure you want to delete this user?</h1>
          <p>This action cannot be undone.</p>
        </CommonDeleteModal>
      )}

      <div className="flex md:flex-row flex-col justify-between items-start md:items-center p-6">
        <div>
          <h1 className="text-2xl font-bold pb-4">User Management</h1>
          <Input
            onChange={searchHandler}
            placeholder="Search by name or email..."
            value={query.searchText}
            allowClear
            style={{ width: 300 }}
          />
        </div>
        <div className="flex mt-4 md:mt-0">
          <Button
            onClick={handleReload}
            icon={<ReloadOutlined />}
            className="mr-4"
          >
            Reload
          </Button>

          <NavLink to="/dash/users/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
            >
              Add User
            </Button>
          </NavLink>
        </div>
      </div>

      <CommonTable
        data={userData}
        columns={columns}
        loading={status === 'loading'}
        total={totalUsers}
        handlePagination={handlePagination}
        tableChange={tableChangeHandler}
      />
    </div>
  );
};

export default UserList;