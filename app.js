const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())

const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null
const initalizeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    await app.listen(3000, () => {
      console.log(
        'server learning at https://viraji7f3fnjscpaqlbe.drops.nxtwave.tech',
      )
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}
initalizeDB()

app.get('/states/', async (request, response) => {
  const getState = `
    SELECT * 
    FROM 
    state
    ORDER BY state_id
    ;`
  const stateArray = await db.all(getState)
  response.send(
    stateArray.map(eachState => ({
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    })),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateByID = `SELECT 
    * FROM
    state 
    WHERE
    state_id = ${stateId}`
  const singleState = await db.get(stateByID)
  response.send({
    stateId: singleState.state_id,
    stateName: singleState.state_name,
    population: singleState.population,
  })
})

app.post('/districts/', async (req, res) => {
  const districtDetail = req.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetail
  const addDetailsOfDistrict = `
    INSERT INTO 
    district 
    (
      
      state_id,
      district_name,
      cases,
      cured,
      active,
      deaths   
    )
    VALUES
    (
      '${stateId}',
      ${districtName},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    );
    `
  await db.run(addDetailsOfDistrict)
  res.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const districtInfo = `
  SELECT * 
  FROM
  district
  WHERE 
  district_id = ${districtId}
  ;`
  const singleDistrict = await db.get(districtInfo)
  res.send({
    districtId: singleDistrict.district_id,
    districtName: singleDistrict.district_name,
    stateId: singleDistrict.state_id,
    cases: singleDistrict.cases,
    cured: singleDistrict.cured,
    active: singleDistrict.active,
    deaths: singleDistrict.deaths,
  })
})

app.delete('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const deleteDistrict = `
  DELETE FROM district WHERE district_id = ${districtId};
  `
  await db.run(deleteDistrict)
  res.send('District Removed')
})

app.put('/districts/:districtId', async (req, res) => {
  const {districtId} = req.params
  const districtUpdateDetail = req.body
  const {districtName, stateId, cases, cured, active, deaths} =
    districtUpdateDetail
  const updateDistrictQuery = `
  UPDATE district 
  SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
  WHERE 
    district_id = ${districtId}
  `
  await db.run(updateDistrictQuery)
  res.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (req, res) => {
  const {stateId} = req.params
  const statsQuery = `
  select 
  sum(cases) as totalCases ,
  sum(cured) as totalCured ,
  sum(active) as totalActive ,
  sum(deaths) as totalDeaths 
  FROM district 
  WHERE 
  state_id = ${stateId};
  `
  const statsData = await db.get(statsQuery)
  res.send(statsData)
})

app.get('/districts/:districtId/details/', async (req, res) => {
  const {districtId} = req.params
  const stateNameByDistrictIdQuery = `
  SELECT 
    state_name
  FROM
    state 
  WHERE
    state_id = (
      SELECT 
        state_id 
      FROM
        district
      WHERE
        district_id = ${districtId}
    );
  `
  const stateNameByDistrictIdData = await db.get(stateNameByDistrictIdQuery)
  res.send({
    stateName: stateNameByDistrictIdData.state_name,
  })
})
module.exports = app
