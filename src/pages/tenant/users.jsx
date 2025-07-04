import React, { useEffect, useState } from 'react';
import {Form, Table, Space, Button, Modal, Transfer, Popconfirm, Select, Tooltip, message} from 'antd';
import {DeleteOutlined, EditOutlined, PlusCircleOutlined} from '@ant-design/icons';
import { getUserList } from '../../api/user';
import {addUsersToTenant, changeTenantUserRole, delUsersOfTenant, getUsersForTenant,} from "../../api/tenant";
import './index.css'
import {getRoleList} from "../../api/role";
import {HandleShowTotal} from "../../utils/lib";

const MyFormItemContext = React.createContext([]);

function toArr(str) {
    return Array.isArray(str) ? str : [str];
}

// Custom form item that uses context for path concatenation
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext);
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined;
    return <Form.Item name={concatName} {...props} />;
};

export const TenantUsers = ({ tenantInfo }) => {
    const [form] = Form.useForm();
    const [addUserModel, setAddUserModel] = useState(false);
    const [mockData, setMockData] = useState([]);
    const [targetKeys, setTargetKeys] = useState([]);
    const [userData,setUserData]=useState([])
    const [userRoles,setUserRoles] = useState([])
    const [selectedUserRole,setSelectedUserRole] = useState(null)

    // Table columns definition
    const columns = [
        {
            title: '#',
            dataIndex: '#',
            key: '#',
            width: '50px',
            render: (_, __, index) => index + 1
        },
        {
            title: '用户名',
            dataIndex: 'userName',
            key: 'userName',
            width: '50px',
        },
        {
            title: '用户ID',
            dataIndex: 'userId',
            key: 'userId',
            width: '50px',
        },
        {
            title: '角色',
            dataIndex: 'userRole',
            key: 'userRole',
            width: '50px',
            render: (_,record) =>
                <div>
                    <Select
                        showSearch
                        placeholder="请选择用户角色"
                        style={{
                            flex: 1,
                            width:'20vh'
                        }}
                        value={record.userRole}
                        options={userRoles}
                        disabled={record.userName === 'admin'}
                        onChange={(role) => changeUserRole(role, record)}
                    />
                </div>
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: '10px',
            render: (_, record) =>
                <Space size="middle">
                    <Tooltip title="删除">
                        <Popconfirm
                            title={`确定要删除用户 ${record.userName} 吗?`}
                            onConfirm={() => handleDelete(record)}
                            okText="确定"
                            cancelText="取消"
                            placement="left"
                        >
                            <a style={{
                                cursor: record.userName === 'admin' ? 'not-allowed' : 'pointer',
                                color: record.userName === 'admin' ? '#b2b2b2' : '#1677ff'
                            }}>
                                <Button type="text" icon={<DeleteOutlined/>} style={{color: "#ff4d4f"}}/>
                            </a>
                        </Popconfirm>
                    </Tooltip>
                </Space>
        },
    ];

    const changeUserRole = async (role,record) =>{
        const cturParams = {
            id: tenantInfo.id,
            userId: record.userId,
            userRole: role,
        }
        await changeTenantUserRole(cturParams)
        getTenantUsers();
        message.open({
            type: 'success',
            content: `用户: ${record.userName}, 角色修改成功`,
        });
    }

    const handleGetUserRole = async () => {
        try {
            const res = await getRoleList()
            const options = res.data.map((item) => (
                {
                    label: item.name,
                    value: item.id
                }))
            setUserRoles(options)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (record) => {
        try {
            const params = {
                id: tenantInfo.id,
                userId: record.userId,
            }
            await delUsersOfTenant(params)
            getTenantUsers();
        } catch (error) {
            console.error(error)
        }
    }

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
        getTenantUsers();
        handleGetUserRole();
    }, []);

    useEffect(() => {
        if (userData) {
            const newKeys = userData.map((item) => item.userId);
            setTargetKeys(newKeys);
        }
    }, [userData]);

    // Function to fetch user data from API
    const fetchData = async () => {
        try {
            const response = await getUserList();
            const data = response.data;
            formatData(data); // Format the fetched data for Transfer
        } catch (error) {
            console.error(error);
        }
    };

    const getTenantUsers = async ()=>{
        try {
            const params = {
                id: tenantInfo.id,
            }
            const res = await getUsersForTenant(params)
            setUserData(res.data.users)
        } catch (error) {
            console.error(error);
        }
    }

    // Format the data for the Transfer component
    const formatData = (data) => {
        const formattedData = data.map((item) => ({
            key: item.userid,
            title: item.username,
            userid: item.userid,
            username: item.username,
            disabled: false,
        }));

        setMockData(formattedData);
    };

    // Handle the closing of the modal
    const onClose = () => {
        setAddUserModel(false);
    };

    // Handle the change in selected keys in Transfer
    const handleOnChange = (keys) => {
        setTargetKeys(keys);
    };

    // Handle form submission
    const handleFormSubmit = async (values) => {
        // Create a list of selected users with their details
        const selectedUsers = targetKeys.map((key) => {
            const user = mockData.find((item) => item.key === key);
            return {
                userid: user?.userid,
                username: user?.title,
            };
        }).filter((user) => user.userid !== undefined);

        try {
            const params = {
                ...values,
                id: tenantInfo.id,
                userRole: selectedUserRole,
                users: selectedUsers,
            };

            await addUsersToTenant(params)
            onClose()
            getTenantUsers()
        } catch (error) {
            console.error(error)
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="link" onClick={() => setAddUserModel(true)}>
                    <PlusCircleOutlined /> 添加成员
                </Button>
            </div>

            <Modal
                visible={addUserModel}
                onCancel={onClose}
                footer={null}
                title="选择用户"
                width={690}
            >
                <Form form={form} name="form_item_path" onFinish={handleFormSubmit}>
                    <MyFormItem name="users" label="">
                        <Transfer
                            showSearch
                            dataSource={mockData}
                            targetKeys={targetKeys}
                            onChange={handleOnChange}
                            render={(item) => item.title}
                            listStyle={{ height: 300, width: 300 }} // Set list styles
                            oneWay // Enable one-way transfer
                            titles={['可选用户', '已选用户']} // Optional titles
                            className="disable-right-transfer"
                        />
                    </MyFormItem>

                    <MyFormItem name="userRole" label="用户角色" rules={[{required: true,}]}>
                        <Select
                            showSearch
                            placeholder="请选择用户角色"
                            style={{
                                flex: 1,
                                width:'100%'
                            }}
                            options={userRoles}
                            onClick={handleGetUserRole}
                            onChange={setSelectedUserRole}
                        />
                    </MyFormItem>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                backgroundColor: '#000000'
                            }}
                        >
                            提交
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Table
                style={{ overflow: 'hidden' }}
                columns={columns}
                dataSource={userData}
                scroll={{
                    x: false,
                    y: '45vh'
                }}
                pagination={{
                    showTotal: HandleShowTotal,
                    pageSizeOptions: ['10'],
                }}
            />
        </>
    );
};
