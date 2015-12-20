import React from 'react'
import classNames from 'classnames'
import $ from 'jquery'
import _ from 'lodash'
import { Datepicker, Timepicker } from 'antd'
import dateFormat from 'dateformat'
import Pagination from 'tb-pagination'
import Checkbox from 'tb-checkbox'
import Radio from 'tb-radio'
import './index.scss'

// 判断当前行是否在选择的行信息里
const inRowList = (info, index, list)=> {
    for (let val of list) {
        if (index === val.index && _.isEqual(info, val.info)) {
            return true
        }
    }
    return false
}

export default class Table extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            datas: [],
            paginOpts: {},
            currentPage: 1,
            loading: false,
            fields: _.cloneDeep(this.props.fields),

            // 行选择模式下选择的行信息
            selectRowList: []
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.setState({
                fields: _.cloneDeep(nextProps.fields)
            })
        }
    }

    componentWillMount() {
        // 查询请求参数
        this.searchOpts = {}

        // 上一个请求返回的内容
        this.prevResponse = null

        // 是否添加表头
        if (this.props.selector.type === 'checkbox') {
            this.state.fields.unshift({
                type: 'checkbox'
            })
        }
        if (this.props.selector.type === 'radio') {
            this.state.fields.unshift({
                type: 'radio'
            })
        }

        this.updateTable()
    }

    // 刷新数据表
    updateTable(page) {
        if (this.props.get.url === '') {
            this.setState({
                datas: this.props.datas
            })
        } else {
            $.ajax({
                url: this.props.get.url,
                beforeSend: ()=> {
                    this.setState({
                        loading: true
                    })
                },
                data: this.props.get.beforeSend(this.searchOpts, page || this.state.currentPage, this.prevResponse)
            }).done((res)=> {
                if (typeof res === 'string') {
                    res = JSON.parse(res)
                }

                // 保存当前返回值
                this.prevResponse = res

                let newPaginOpts = this.state.paginOpts
                let newDatas = this.props.get.success(res, newPaginOpts)

                this.setState({
                    datas: newDatas,
                    paginOpts: newPaginOpts,
                    currentPage: page || this.state.currentPage,
                    loading: false,
                    selectRowList: []
                })
            })
        }
    }

    // 翻页
    handleChangePage(page) {
        this.updateTable(page)
    }

    // radio行选择点击
    onTrRadioClick(info, index) {
        this.setState({
            selectRowList: [{
                info: info,
                index: index
            }]
        })
    }

    // checkbox行选择点击
    onTrCheckboxClick(info, index, checked) {
        let newSelectRowList = _.cloneDeep(this.state.selectRowList)

        if (checked) {
            newSelectRowList.push({
                info: info,
                index: index
            })
        } else {
            _.remove(newSelectRowList, function (item) {
                if (item.index === index && _.isEqual(item.info, info)) {
                    return true
                }
                return false
            })
        }

        this.setState({
            selectRowList: newSelectRowList
        })
    }

    // checkbox行全选
    onTrCheckboxSelectAll(checked) {
        if (checked) {
            let newSelectRowList = []
            this.state.datas.map((item, index)=> {
                newSelectRowList.push({
                    info: item,
                    index: index
                })
            })
            this.setState({
                selectRowList: newSelectRowList
            })
        } else {
            this.setState({
                selectRowList: []
            })
        }
    }

    render() {
        let Th = this.state.fields.map((item, index)=> {
            switch (item.type) {
            case 'checkbox':
                return (
                    <th key={index}
                        style={{width:100}}>
                        <Checkbox onChange={this.onTrCheckboxSelectAll.bind(this)}
                                  checked={this.state.datas.length===this.state.selectRowList.length}>全选</Checkbox>
                    </th>
                )
            case 'radio':
                return (
                    <th key={index}
                        style={{width:100}}></th>
                )
            default:
                return (
                    <th key={index}>{item.value}</th>
                )
            }

        })

        let TrTd = this.state.datas.map((tr, index)=> {
            let Td = this.state.fields.map((field, fieldIndex)=> {
                switch (field.type) {
                case 'checkbox':
                    return (
                        <td key={fieldIndex}>
                            <Checkbox onChange={this.onTrCheckboxClick.bind(this,tr,index)}
                                      checked={inRowList(tr,index,this.state.selectRowList)}/>
                        </td>
                    )
                case 'radio':
                    return (
                        <td key={fieldIndex}>
                            <Radio onChange={this.onTrRadioClick.bind(this,tr,index)}
                                   checked={inRowList(tr,index,this.state.selectRowList)}/>
                        </td>
                    )
                default:
                    return (
                        <td key={fieldIndex}>{tr[field.key]}</td>
                    )
                }
            })

            return (
                <tr key={index}>
                    {Td}
                </tr>
            )
        })

        let SearchBar = this.props.search.map((item, index)=> {

        })

        return (
            <div className="_namespace">
                <div className="panel">
                    <div className="panel-heading">
                        {this.props.title}
                    </div>

                    {_.isEmpty(this.props.search) ? null : <div className="search-bar">
                        {SearchBar}
                    </div>}

                    <table className="table table-striped">
                        <thead>
                        <tr>
                            {Th}
                        </tr>
                        </thead>
                        <tbody>
                        {_.isEmpty(this.state.datas) ?
                            <tr>
                                <td colSpan={this.state.fields.length}>
                                    <span className="empty-content">暂时没有数据~</span>
                                </td>
                            </tr> : TrTd}
                        </tbody>
                    </table>

                    {_.isEmpty(this.state.paginOpts) ? null :
                        <div className="pagination-container">
                            <Pagination onChange={this.handleChangePage.bind(this)}
                                {...this.state.paginOpts}
                                        loading={this.state.loading}/>
                        </div>
                    }
                </div>
            </div>
        )
    }
}

Table.defaultProps = {
    title: '表格',

    // 表头字段
    fields: [],

    // 打底数据
    datas: [],

    add: {
        url: '',
        method: 'get',
        beforeSend: (info)=> {
            return info
        },
        success: (res)=> {
            return res.errno === 0
        }
    },

    del: {
        url: '',
        method: 'get',
        beforeSend: (info)=> {
            return info
        },
        success: (res)=> {
            return res.errno === 0
        }
    },

    update: {
        url: '',
        method: 'get',
        beforeSend: (info)=> {
            return info
        },
        success: (res)=> {
            return res.errno === 0
        }
    },

    get: {
        url: '',
        method: 'get',
        beforeSend: (info)=> {
            return info
        },
        success: (res)=> {
            return res.data
        }
    },

    search: [],

    // 行选择
    selector: {}
}