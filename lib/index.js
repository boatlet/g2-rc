/**
 * Created by wyz on 2016/8/29.
 */
import G2 from 'g2';
import React from 'react';
import "./range.css"

let uniqueId = 0;
function generateUniqueId() {
    return `rc-g2-${uniqueId++}`;
}
window.G2 = G2;
/**
 * todo:1.g2有个特点 第一传data结构要和后面传的data结构一致  如何去解决这个问题？只能是发现当前后两次的数据不一致重新生成了一个新的组件了
 *  2.提供一个扩展数据的通用方法:
 *  根据react的尿性 如果读取数据晚于第一次render 那本组件必须要在初始化时传一个相同结构的假数据或者在一开没有数据的时候不渲染 但是这样增加使用时候的代价
     *  所以这边扩展一个自动生成数据的功能，需要参数：{dataOpt:{struct,keys,fill,keyName}}
 * @param __operation
 * @returns {Component}
 */

function insertScript(url,callback){
    var oScript = document.createElement('script');
    oScript.src = url;
    oScript.type = 'text/javascript';
    oScript.async = false
    if(typeof callback === 'function')
        oScript.onload = function(){
            callback();
        }
    document.body.appendChild(oScript);
}

Array.prototype.unique = function(){
    this.sort();
    var re=[this[0]];
    for(var i = 1; i < this.length; i++){
        if( this[i] !== re[re.length-1]){
            re.push(this[i]);
        }
    }
    return re;
}

function is(a,b){

    if(typeof a != typeof b){
        return false;
    }
    if(a.length != b.length){
        return false;
    }
    var bool = true;

    var keyArr1 = [];
    var keyArr2 = [];

    for(var i in o1){
        keyArr1.push(i);
    }

    for(var i in o2){
        keyArr2.push(i);
    }

    if(keyArr1.length != keyArr2.length){
        return false;
    }

    Array.prototype.push.apply(keyArr1,keyArr2);

    var keyArr = keyArr1.unique();

    for(var i=0,k=keyArr.length;i<k;i++){
        if( ( keyArr[i] in o1 ) && ( keyArr[i] in o2 ) ){
            if( typeof o1[keyArr[i]] == 'object' && typeof o2[keyArr[i]] == 'object' ){
                bool = is( o1[keyArr[i]], o2[keyArr[i]] );
            }else if( o1[keyArr[i]] !== o2[keyArr[i]] ){
                return false;
            }
        }else{
            return false;
        }
    }

    return bool;
}

export default function createG2(__operation) {
    class Component extends React.Component {

        constructor(props, context) {
            super(props, context);
            this.chart = null;
            this.chartId = generateUniqueId();
        }

        componentDidMount() {
            this.initChart(this.props);
        }

        _is(a,b){
            return is(a,b);
        }

        componentWillReceiveProps(newProps) {
            const { data: newData, width: newWidth, height: newHeight, plotCfg: newPlotCfg,range} = newProps;
            const { data: oldData, width: oldWidth, height: oldHeight, plotCfg: oldPlotCfg} = this.props;

            if (!this._is(newPlotCfg,oldPlotCfg)) {
                console.warn('plotCfg 不支持修改');
            }

            if (!this._is(newData,oldData) ) {
                this.chart.changeData(newData);
                if(range && newData.data){
                    this.renderRange(range,newData.data,this.chart);
                }
            }
            if (newWidth !== oldWidth || newHeight !== oldHeight) {
                this.chart.changeSize(newWidth, newHeight);
            }
        }

        componentWillUnmount() {
            //window.G2 = undefined;
            this.chart.destroy();
            this.chart = null;
            this.chartId = null;
        }

        renderRange(range,data,chart){
            if(!G2.Plugin.range){
                return
            }
            let id = `${this.chartId}-range`;
            if(document.getElementById(id).innerHTML){
                document.getElementById(id).innerHTML = ""
            }
            let obj = range;
            obj.id = id;
            const Range = new G2.Plugin.range(obj);
            Range.source(data);
            Range.link(chart);
            Range.render();
        }

        initChart(props) {
            const { width, data, plotCfg, forceFit, initChart, dims, heightRatio,range} = props;
            let {height} = props;
            if(typeof heightRatio === "number"){
                let domWidth = document.getElementById(this.chartId).offsetWidth;
                height = domWidth * heightRatio;
            }

            const chart = new G2.Chart({
                id: this.chartId,
                width, height,
                plotCfg,
                forceFit,
            });
            chart.source(data,dims);
            if(typeof initChart === "function"){
                initChart(chart);
            }else{
                __operation(chart);
            }
            if(range){
                insertScript("/static/global/plugins/g2/range.js",()=>{
                    this.renderRange(range,data,chart);
                })
            }
            this.chart = chart;
        }

        render() {
            const {range} = this.props;
            return (
                <div>
                    <div id={this.chartId} />
                    {
                        range ? <div style={range.style}><div id={`${this.chartId}-range`} /></div> : null
                    }
                </div>
            );
        }
    }

    Component.propTypes = {
        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number,
        heightRatio:React.PropTypes.number,
        plotCfg: React.PropTypes.object,
        forceFit: React.PropTypes.bool,
    };

    return Component;
}
