const models = require("../models");
const {throwException} = require("../global/helpers");

async function getAppointmentsByMonth(query) {
  const { month, year, AgreementId, HeadquarterId } = query
  const fullDate = `${month}-${year}`

  let conditions = [{status: 'E'}]
  //let conditions = []
  if(month && year)
    conditions.push(models.sequelize.where(models.sequelize.fn('to_char', models.sequelize.col('dateAppointment'), 'MM-YYYY'), fullDate))
  if(AgreementId)
    conditions.push({'$PriceList.AgreementId$': AgreementId})
  if(HeadquarterId)
    conditions.push({HeadquarterId})
    
  const appointments = await models.Appointment.findAll({
    where: {
      $and: conditions
    },
    include: [{
      model: models.Client
    }, {
      model: models.Examination,
      include: [{
        model: models.PriceList,
        where: {
          id: { $col: 'Appointment.PriceListId' }
        },
      },{
        model: models.Service,
      }]
    },{
      model: models.PriceList,
    }]
  })
  
  if(!appointments || !appointments.length)
    throwException('E017')

  let appointmentsByDateObj = {}
  let appointmentsByDate = []
  let acumTotalPriceAppointments = 0
  let acumTotalPriceExams = 0

  /*
  appointmentsByDateObj: {
    21/10/2019: [] //array of appointments
    23/10/2019: [] //array of appointments
    .
  }
  */
  for (let appoinment of appointments) {
    let ap = appoinment.toJSON()
    if (!appointmentsByDateObj.hasOwnProperty(ap.dateAppointmentEU))
      appointmentsByDateObj[ap.dateAppointmentEU] = []
    appointmentsByDateObj[ap.dateAppointmentEU].push(ap)
    acumTotalPriceAppointments += ap.totalPrice
    
    let examsByServiceObj = {}
    let examsByService = []
    for (let ex of ap.Examinations) {
      acumTotalPriceExams += ex.PriceLists[0].ExaminationPrice.price
      if (!examsByServiceObj.hasOwnProperty(ex.Service.name))
        examsByServiceObj[ex.Service.name] = []
        
      examsByServiceObj[ex.Service.name].push(ex)  
    }
    
    for (let service in examsByServiceObj) {
      let serviceObk = {
        service,
        examinations: examsByServiceObj[service]
      }
      examsByService.push(serviceObk)
    }
    ap.Services = examsByService
    delete ap.Examinations
  }

  //date is a key
  for (let date in appointmentsByDateObj) {
    let dateObj = {
      date,
      appointments: appointmentsByDateObj[date]
    }
    appointmentsByDate.push(dateObj)
  }

  return {
    appointmentsByDate,
    acumTotalPriceAppointments,
    acumTotalPriceExams
  }
}

async function getAppointmentResultsPDF(AppointmentId) {
  let servicesQuery = await models.Service.findAll({
    include: [{
      model: models.Examination,
      separate: true,
      include: [
        {
          model: models.Appointment, where: {id: AppointmentId},
          include: [{ 
            model: models.Employee,
            as: "Responsible",
            required: false,
            include: [{ model: models.Speciality }]
          }]
        },
        {
          model: models.ExaminationValue,
          include: [{
            model: models.AppointmentDetail,
            where: { AppointmentId, ExaminationId: {$col: 'Examination.id'} },
            required: false
          }]
        },
      ]      
    }],
    order: [
      ['id', 'asc']
    ]
  })
  
  let services = []
  //This is necessary, because with "separate: true"
  //the query brings back all services, even without examinations
  //and "required: true" doesn't work because there are two queries separate
  for(let service of servicesQuery){
    service = service.toJSON()
    if(service.Examinations.length){
      services.push(service)
      for(let exam of service.Examinations){
        let groupsMap = {}
        for(let rV of exam.ExaminationValue){
          if(groupsMap.hasOwnProperty(rV.ExaminationReferenceValue.group))
           groupsMap[rV.ExaminationReferenceValue.group].push(rV)
          else
            groupsMap[rV.ExaminationReferenceValue.group] = [rV]
        }
        let groupsArray = []
        for(let key in groupsMap)
          groupsArray.push({
            name: key,
            ReferenceValues: groupsMap[key]
          })
        delete exam.ExaminationValue
        exam.Groups = groupsArray
      }
    }
  }

  return {rows: services}
}

module.exports = {
  getAppointmentsByMonth,
  getAppointmentResultsPDF
}
