import { ReactComponent as FeiShuIcon } from "./img/feishu.svg"
import { ReactComponent as DingdingIcon } from "./img/dingding.svg"
import { ReactComponent as EmailIcon } from "./img/Email.svg"
import { ReactComponent as WeChatIcon } from "./img/qywechat.svg"
import { ReactComponent as CustomHookIcon } from "./img/customhook.svg"
import { ReactComponent as SlackIcon } from "./img/slack.svg"


const NOTIFICATION_TYPES = {
    FeiShu: {
        icon: FeiShuIcon,
        label: "飞书",
    },
    DingDing: {
        icon: DingdingIcon,
        label: "钉钉",
    },
    Email: {
        icon: EmailIcon,
        label: "邮件",
    },
    WeChat: {
        icon: WeChatIcon,
        label: "企业微信",
    },
    CustomHook: {
        icon: CustomHookIcon,
        label: "自定义Hook",
    },
    Slack: {
        icon: SlackIcon,
        label: "Slack"
    }
}

export const NotificationTypeIcon = ({ type }) => {
    const notificationType = NOTIFICATION_TYPES[type]

    if (!notificationType) {
        return "-"
    }

    const IconComponent = notificationType.icon

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <IconComponent style={{ height: "25px", width: "25px" }} />
            <div style={{ marginLeft: "5px", fontSize: "12px" }}>{notificationType.label}</div>
        </div>
    )
}

