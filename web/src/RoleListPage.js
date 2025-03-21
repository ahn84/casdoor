// Copyright 2021 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Link} from "react-router-dom";
import {Button, Switch, Table, Upload} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as RoleBackend from "./backend/RoleBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./common/modal/PopconfirmModal";
import {UploadOutlined} from "@ant-design/icons";

class RoleListPage extends BaseListPage {
  newRole() {
    const randomName = Setting.getRandomName();
    const owner = Setting.getRequestOrganization(this.props.account);
    return {
      owner: owner,
      name: `role_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Role - ${randomName}`,
      users: [],
      groups: [],
      roles: [],
      domains: [],
      isEnabled: true,
    };
  }

  addRole() {
    const newRole = this.newRole();
    RoleBackend.addRole(newRole)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/roles/${newRole.owner}/${newRole.name}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteRole(i) {
    RoleBackend.deleteRole(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.fetch({
            pagination: {
              ...this.state.pagination,
              current: this.state.pagination.current > 1 && this.state.data.length === 1 ? this.state.pagination.current - 1 : this.state.pagination.current,
            },
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {

      });
  }

  uploadRoleFile(info) {
    const {status, response: res} = info.file;
    if (status === "done") {
      if (res.status === "ok") {
        Setting.showMessage("success", "Users uploaded successfully, refreshing the page");

        const {pagination} = this.state;
        this.fetch({pagination});
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to sync")}: ${res.msg}`);
      }
    } else if (status === "error") {
      Setting.showMessage("error", "File failed to upload");
    }
  }

  renderRoleUpload() {
    const props = {
      name: "file",
      accept: ".xlsx",
      method: "post",
      action: `${Setting.ServerUrl}/api/upload-roles`,
      withCredentials: true,
      onChange: (info) => {
        this.uploadRoleFile(info);
      },
    };

    return (
      <Upload {...props}>
        <Button icon={<UploadOutlined />} type="primary" size="small">
          {i18next.t("user:Upload (.xlsx)")}
        </Button>
      </Upload>
    );
  }
  renderTable(roles) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        fixed: "left",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/roles/${record.owner}/${encodeURIComponent(record.name)}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, record, index) => {
          return (
            <Link to={`/organizations/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("role:Sub users"),
        dataIndex: "users",
        key: "users",
        // width: '100px',
        sorter: true,
        ...this.getColumnSearchProps("users"),
        render: (text, record, index) => {
          return Setting.getTags(text, "users");
        },
      },
      {
        title: i18next.t("role:Sub groups"),
        dataIndex: "groups",
        key: "groups",
        // width: '100px',
        sorter: true,
        ...this.getColumnSearchProps("groups"),
        render: (text, record, index) => {
          return Setting.getTags(text, "groups");
        },
      },
      {
        title: i18next.t("role:Sub roles"),
        dataIndex: "roles",
        key: "roles",
        // width: '100px',
        sorter: true,
        ...this.getColumnSearchProps("roles"),
        render: (text, record, index) => {
          return Setting.getTags(text, "roles");
        },
      },
      {
        title: i18next.t("role:Sub domains"),
        dataIndex: "domains",
        key: "domains",
        sorter: true,
        ...this.getColumnSearchProps("domains"),
        render: (text, record, index) => {
          return Setting.getTags(text);
        },
      },
      {
        title: i18next.t("general:Is enabled"),
        dataIndex: "isEnabled",
        key: "isEnabled",
        width: "120px",
        sorter: true,
        render: (text, record, index) => {
          return (
            <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" checked={text} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "",
        key: "op",
        width: "170px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/roles/${record.owner}/${encodeURIComponent(record.name)}`)}>{i18next.t("general:Edit")}</Button>
              <PopconfirmModal
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteRole(index)}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={roles} rowKey={(record) => `${record.owner}/${record.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Roles")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={this.addRole.bind(this)}>{i18next.t("general:Add")}</Button>
              {
                this.renderRoleUpload()
              }
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    RoleBackend.getRoles(Setting.isDefaultOrganizationSelected(this.props.account) ? "" : Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      });
  };
}

export default RoleListPage;
