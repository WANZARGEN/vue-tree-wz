/* eslint-disable @typescript-eslint/no-explicit-any,no-empty-function */
import {
    HelperToolSet,
    initReactive, optionalType, StateToolSet, SyncStateToolSet,
} from '@/lib/toolset';
import { UnwrapRef } from '@vue/composition-api/dist/reactivity';
import {
    computed, reactive,
} from '@vue/composition-api';
import { findIndex } from 'lodash';

export interface TreeNodeStateType<T=any, S extends BaseNodeStateType = BaseNodeStateType> {
    level: number;
    padSize: string;
    toggleSize: string;
    disableToggle: boolean;
    classNames: ClassNamesType<T, S>;
}

export interface BaseNodeStateType {
    expanded: boolean;
}

type ClassNamesType<T=any, S extends BaseNodeStateType = BaseNodeStateType> = (node: TreeNode<T, S>) => {[name: string]: boolean};

export interface TreeNodeProps<T=any, S extends BaseNodeStateType = BaseNodeStateType> extends TreeNodeStateType, TreeNodeSyncStateType<T, S> {}

export interface TreeNodeSyncStateType<T=any, S extends BaseNodeStateType = BaseNodeStateType> {
    data: T;
    children: TreeNodeProps<T, S>[] | boolean;
    state: S;
}

export interface InitTreeNodeProps<T=any, S extends BaseNodeStateType = BaseNodeStateType> extends TreeNodeSyncStateType<T, S> {
    level?: number;
    padSize?: string;
    toggleSize?: string;
    disableToggle?: boolean;
    classNames?: ClassNamesType<T, S>;
}

export const getBaseNodeState = (): BaseNodeStateType => ({ expanded: false });

export const getDefaultNode = <T=any, S extends BaseNodeStateType = BaseNodeStateType>(data: T, init?: InitTreeNodeProps<T, S>): InitTreeNodeProps<T, S> => ({
    data,
    children: false,
    state: getBaseNodeState() as S,
    ...init,
});

export interface TreeNode<T=any, S extends BaseNodeStateType = BaseNodeStateType> extends TreeNodeProps {
    key: number;
    sync: UnwrapRef<TreeNodeSyncStateType<T, UnwrapRef<S>>>;
}

@StateToolSet<TreeNodeStateType>()
@SyncStateToolSet<TreeNodeSyncStateType>()
export class TreeNodeState<
    data=any, state extends BaseNodeStateType = BaseNodeStateType,
    initData=any, initState extends TreeNodeStateType<data, state> = TreeNodeStateType<data, state>,
    initSyncData=any, initSyncState extends TreeNodeSyncStateType<data, state> = TreeNodeSyncStateType<data, state>,
    > {
    state: UnwrapRef<optionalType<initState, initData>>

    syncState: UnwrapRef<optionalType<initSyncState, initSyncData>>

    static initState(): TreeNodeStateType {
        return {
            level: 0,
            padSize: '1rem',
            toggleSize: '1rem',
            disableToggle: true,
            classNames: (node: TreeNode) => ({
                basic: true,
                [`level-${node.level}`]: true,
                ...node.state,
            }),
        };
    }

    static initSyncState(): TreeNodeSyncStateType {
        return {
            data: '',
            children: false,
            state: getBaseNodeState(),
        };
    }

    constructor(initData: initData = {} as initData, initSyncData: initSyncData = {} as initSyncData, lazy = false) {
        this.state = initReactive(lazy, TreeNodeState.initState(), initData);
        this.syncState = initReactive(lazy, TreeNodeState.initSyncState(), initSyncData);
    }
}


export interface TreeNodeMetaState<T=any, S extends BaseNodeStateType = BaseNodeStateType> {
    nodes: InitTreeNodeProps<T, S>[];
    selectedNodes: TreeNode<T, S>[];
    firstSelectedNode: TreeNode<T, S>;
}


@HelperToolSet()
export class TreeNodeToolSet<
    data=any, state extends BaseNodeStateType = BaseNodeStateType,
    initData=any, initSyncData=any
    > extends TreeNodeState<data, state, initData, TreeNodeStateType<data, state>, initSyncData, TreeNodeSyncStateType<data, state>> {
    metaState: UnwrapRef<TreeNodeMetaState<data, state>> = null as unknown as UnwrapRef<TreeNodeMetaState<data, state>>;

    isMultiSelect = false;

    setSelectedNodes: (node?: TreeNode<data, state>) => void = () => {};

    static initToolSet(_this: TreeNodeToolSet<any, any>, isMultiSelect: boolean): void {
        _this.isMultiSelect = isMultiSelect;
        _this.metaState = reactive({
            nodes: [],
            selectedNodes: [],
            firstSelectedNode: computed(() => _this.metaState.selectedNodes[0]),
        });
        _this.setSelectedNodes = (node?: TreeNode): void => {
            if (!node) {
                _this.metaState.selectedNodes = [];
                return;
            }

            if (_this.isMultiSelect) {
                const idx = findIndex(_this.metaState.selectedNodes, (d: TreeNode) => d.key === node.key && d.level === node.level);
                if (idx === -1) _this.metaState.selectedNodes.push(node);
                else _this.metaState.selectedNodes.splice(idx, 1);
            } else {
                _this.metaState.selectedNodes = [node];
            }
        };
    }

    constructor(initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
        isMultiSelect = false) {
        super(initData, initSyncData);
        TreeNodeToolSet.initToolSet(this, isMultiSelect);
    }
}


export const treeNodeProps = {
    level: {
        type: Number,
        default: 0,
    },
    padSize: {
        type: String,
        default: '1rem',
    },
    toggleSize: {
        type: String,
        default: '1rem',
    },
    disableToggle: {
        type: Boolean,
        default: false,
    },
    classNames: {
        type: Function,
        default: (node: TreeNode): ReturnType<ClassNamesType> => ({
            basic: true,
            [`level-${node.level}`]: true,
            ...node.state,
        }),
    },
    /**
     * sync
     */
    data: {
        type: [Array, Object, String, Number, Boolean],
        default: '',
        required: true,
    },
    /**
     * sync
     */
    children: {
        type: [Array, Boolean],
        default: false,
    },
    /**
     * sync
     */
    state: {
        type: Object,
        default: (): BaseNodeStateType => ({ expanded: false }),
        validator(state): boolean {
            return state instanceof Object && state.expanded !== undefined;
        },
    },
};
