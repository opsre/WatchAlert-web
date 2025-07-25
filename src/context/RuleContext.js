import React, { createContext, useContext, useState } from 'react';

// 1. 創建一個通用的 Context，用於存放所有共享的狀態
const AppContext = createContext();

// 2. 通用的 Context Provider
export const AppContextProvider = ({ children }) => {
    // 使用一個單一的 state 物件來管理所有需要共享的數據
    const [appState, setAppState] = useState({
        cloneAlertRule: null, // 用于克隆告警规则
        ruleTemplate: null, // 用於管理規則模板的狀態
        cloneProbeRule: null,   // 用于克隆拨测规则
    });

    // 提供一個統一的更新函數，或者也可以提供多個特定的更新函數
    const updateAppState = (key, value) => {
        setAppState(prevState => ({
            ...prevState,
            [key]: value
        }));
    };

    // 明確的 setter：
    const setRuleTemplate = (ruleTemplate) => updateAppState('ruleTemplate', ruleTemplate);
    const setCloneProbeRule = (cloneProbeRule) => updateAppState('cloneProbeRule', cloneProbeRule);
    const setCloneAlertRule = (cloneAlertRule) => updateAppState('cloneAlertRule', cloneAlertRule);

    return (
        <AppContext.Provider value={{
            appState,
            setRuleTemplate,
            setCloneProbeRule,
            setCloneAlertRule
        }}>
            {children}
        </AppContext.Provider>
    );
};

// 3. 通用的 Hook 來使用這個 Context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext 必須在 AppContextProvider 內部使用');
    }
    return context;
};
