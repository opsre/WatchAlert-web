import { AlertRuleList } from "../pages/alert/rule";
import { AlertRuleGroup } from "../pages/alert/ruleGroup";
import { RuleTemplate } from "../pages/alert/tmpl";
import { RuleTemplateGroup } from "../pages/alert/tmplGroup";
import { Datasources } from "../pages/datasources";
import { DutyManage } from "../pages/duty";
import { Home } from "../pages/home";
import { UserRole } from "../pages/members/role";
import { User } from "../pages/members/user";
import { NoticeObjects } from "../pages/notice";
import { NoticeTemplate } from "../pages/notice/tmpl";
import { Silences } from "../pages/silence";
import { Login } from "../pages/login";
import Error from "../utils/Error"
import { ComponentsContent } from '../components';
import { Tenants } from "../pages/tenant";
import { GrafanaDashboardComponent } from "../pages/dashboards/dashboard/iframe";
import { DashboardFolder } from "../pages/dashboards/folder";
import { AuditLog } from "../pages/audit";
import { SystemSettings } from "../pages/settings";
import { TenantDetail } from "../pages/tenant/detail";
import { AlertRule } from "../pages/alert/rule/create";
import {Dashboards} from "../pages/dashboards/dashboard";
import {Subscribe} from "../pages/subscribe";
import {CreateSubscribeModel} from "../pages/subscribe/create";
import {NoticeRecords} from "../pages/notice/history";
import {CalendarApp} from "../pages/duty/calendar";
import {Probing} from "../pages/probing";
import {CreateProbingRule} from "../pages/probing/create";
import {OnceProbing} from "../pages/probing/once";
import Profile from "../pages/profile";
import {FaultCenter} from "../pages/faultCenter";
import {FaultCenterDetail} from "../pages/faultCenter/detail";

// eslint-disable-next-line import/no-anonymous-default-export
export default [
    {
        path: '/',
        element: <ComponentsContent name="off" c={<Home />} />,
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/ruleGroup',
        element: <ComponentsContent name="告警规则组" c={<AlertRuleGroup />} />,
    },
    {
        path: '/ruleGroup/:id/rule/list',
        element: <ComponentsContent name="告警规则" c={<AlertRuleList />} />
    },
    {
        path: '/ruleGroup/:id/rule/add',
        element: <ComponentsContent name="添加告警规则" c={<AlertRule type="add"/>} />
    },
    {
        path: '/ruleGroup/:id/rule/:ruleId/edit',
        element: <ComponentsContent name="编辑告警规则" c={<AlertRule type="edit"/>} />
    },
    {
        path: '/silenceRules',
        element: <ComponentsContent name="静默规则" c={<Silences />} />
    },
    {
        path: '/tmplType/:tmplType/group',
        element: <ComponentsContent name="规则模版组" c={<RuleTemplateGroup />} />,
    },
    {
        path: '/tmplType/:tmplType/:ruleGroupName/templates',
        element: <ComponentsContent name="规则模版" c={<RuleTemplate />} />
    },
    {
        path: '/noticeObjects',
        element: <ComponentsContent name="通知对象" c={<NoticeObjects />} />
    },
    {
        path: '/noticeTemplate',
        element: <ComponentsContent name="通知模版" c={<NoticeTemplate />} />
    },
    {
        path: '/noticeRecords',
        element: <ComponentsContent name="通知记录" c={<NoticeRecords />} />
    },
    {
        path: '/dutyManage',
        element: <ComponentsContent name="值班中心" c={<DutyManage />} />
    },
    {
        path: '/dutyManage/:id/calendar',
        element: <ComponentsContent name="值班表" c={<CalendarApp />} />
    },
    {
        path: '/user',
        element: <ComponentsContent name="用户管理" c={<User />} />
    },
    {
        path: '/userRole',
        element: <ComponentsContent name="角色管理" c={<UserRole />} />
    },
    {
        path: '/tenants',
        element: <ComponentsContent name="租户管理" c={<Tenants />} />
    },
    {
        path: '/tenants/detail/:id',
        element: <ComponentsContent name="租户" c={<TenantDetail/>} />
    },
    {
        path: '/datasource',
        element: <ComponentsContent name="数据源" c={<Datasources />} />
    },
    {
        path: '/folders',
        element: <ComponentsContent name="仪表盘目录" c={<DashboardFolder />} />
    },
    {
        path: '/folder/:id/list',
        element: <ComponentsContent name="仪表盘" c={<Dashboards />} />
    },
    {
        path: 'dashboard/f/:fid/g/:did/info',
        element: <ComponentsContent name="仪表盘详情" c={<GrafanaDashboardComponent />} />
    },
    {
        path: '/auditLog',
        element: <ComponentsContent name="日志审计" c={<AuditLog />} />
    },
    {
        path: '/settings',
        element: <ComponentsContent name="系统设置" c={<SystemSettings/>}/>
    },
    {
        path: '/onceProbing',
        element: <ComponentsContent name="及时拨测" c={<OnceProbing/>} />
    },
    {
        path: '/probing',
        element: <ComponentsContent name="拨测任务" c={<Probing/>} />
    },
    {
        path: '/probing/create',
        element: <ComponentsContent name="创建拨测规则" c={<CreateProbingRule type="add"/>} />
    },
    {
        path: '/probing/:id/edit',
        element: <ComponentsContent name="编辑拨测规则" c={<CreateProbingRule type="edit"/>} />
    },
    {
        path: '/subscribes',
        element: <ComponentsContent name="告警订阅" c={<Subscribe />} />
    },
    {
        path: '/subscribe/create',
        element: <ComponentsContent name="添加订阅" c={<CreateSubscribeModel />} />
    },
    {
        path: '/profile',
        element: <ComponentsContent name="个人信息" c={<Profile />} />
    },
    {
        path: '/faultCenter',
        element: <ComponentsContent name="故障中心" c={<FaultCenter />} />
    },
    {
        path: '/faultCenter/detail/:id',
        element: <ComponentsContent name="故障中心详情" c={<FaultCenterDetail />} />
    },
    {
        path: '/*',
        element: <Error />
    }
]