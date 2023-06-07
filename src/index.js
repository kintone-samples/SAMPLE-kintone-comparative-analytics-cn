/* eslint-disable no-param-reassign */
import * as echarts from 'echarts'

const getReacords = async (query) => {
  const { records = [] } = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
    app: kintone.app.getId(),
    fields: ['date', 'table'],
    query: `${query} order by date asc`,
  })
  return records
}

const toArray = (records) => {
  return records.reduce((sums, record) => {
    const date = new Date(record.date.value)
    const month = date.getMonth()
    const subs = record.table.value
    const total = subs.reduce((sum, obj) => {
      sum += parseInt(obj.value.total.value, 10)
      return sum
    }, 0)
    sums[month] += total
    return sums
  }, Array(12).fill(0))
}

;(() => {
  kintone.events.on('app.record.index.show', async (event) => {
    if (document.getElementById('root')) {
      return event
    }
    const root = document.createElement('div')
    root.id = 'root'
    root.style.padding = '20px'
    const div = document.createElement('div')
    div.style.width = '100%'
    div.style.height = '500px'
    root.appendChild(div)
    kintone.app.getHeaderSpaceElement().appendChild(root)
    const chart = echarts.init(div)
    chart.showLoading()
    const condition = kintone.app.getQueryCondition()
      ? kintone.app.getQueryCondition()
      : 'date > LAST_YEAR() and date <= TODAY()'
    const thisRecord = await getReacords(condition)
    const thisYear = toArray(thisRecord).reduceRight(
      (acc, curr) => (curr === 0 && acc.length === 0 ? acc : [curr, ...acc]),
      [],
    )
    if (thisRecord.length > 0) {
      const year = new Date(thisRecord[0].date.value).getFullYear()
      const regx = /(?:and|or)?\s*date\s*(?:>|<|=|>=|<=)\s*(?:\w+\(\)|"\d{4}-\d{2}-\d{2}")\s*(?:and|or)?/g
      const query = condition.replaceAll(regx, '')
      const lastCondition = `date < "${year}-01-01" and date >= "${year - 1}-01-01" ${
        query.trim().length > 0 ? ` and ${query}` : ``
      }`
      const lastYear = toArray(await getReacords(lastCondition))
      const yoY = thisYear.map((data, index) =>
        lastYear[index] > 0 ? ((data - lastYear[index]) / lastYear[index]) * 100 : 1,
      )
      const moM = thisYear.map((data, index) => {
        const cardinality = index === 0 ? lastYear[11] : thisYear[index - 1]
        return cardinality > 0 ? ((data - cardinality) / cardinality) * 100 : 1
      })

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: false },
            saveAsImage: { show: true },
          },
        },
        legend: {
          data: ['LastYear', 'ThisYear', 'YoY', 'MoM'],
        },
        xAxis: [
          {
            type: 'category',
            axisTick: {
              alignWithLabel: true,
            },
            data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          },
        ],
        yAxis: [
          {
            type: 'value',
            name: 'Yuan',
            min: 0,
            axisLabel: {
              formatter: '{value}',
            },
          },
          {
            type: 'value',
            name: 'Percentage',
            axisLabel: {
              formatter: '{value}%',
            },
          },
        ],
        series: [
          {
            name: 'LastYear',
            type: 'bar',
            data: lastYear,
          },
          {
            name: 'ThisYear',
            type: 'bar',
            data: thisYear,
          },
          {
            name: 'YoY',
            type: 'line',
            data: yoY,
            yAxisIndex: 1,
          },
          {
            name: 'MoM',
            type: 'line',
            data: moM,
            yAxisIndex: 1,
          },
        ],
      }
      chart.setOption(option)
    }
    chart.hideLoading()
    return event
  })
})()
