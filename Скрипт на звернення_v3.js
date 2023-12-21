function setPropertyRequired(attributeName, boolValue = true) {
  //обов"язкове
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.required = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyHidden(attributeName, boolValue = true) {
  //приховане
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.hidden = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyDisabled(attributeName, boolValue = true) {
  //недоступне
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.disabled = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function validationIsValue(attributeName, nameForThrow) {
  if (!EdocsApi.getAttributeValue(attributeName).value) {
    throw `Не заповнено значення поля "${nameForThrow}"`;
  }
}
//Скрипт 1. Зміна властивостей атрибутів при створені документа
function onCreate() {
  setContractorRPEmailOnCreate();
  setBranchAndSectionsOnCreate();
}

function setCreateProps() {
  if (CurrentDocument.inExtId) {
    setPropertyRequired("Subject");
    setPropertyRequired("Branch");
    setPropertyRequired("RegNumber");
    setPropertyRequired("RegDate");
    setPropertyRequired("Registraion");
  }
}

//Скрипт 2. Зміна властивостей атрибутів після виконання завдання
function onCardInitialize() {
  SendOutDocTask();
  ToDoPaymentOptionTask();
  ReceiptFundsTask();
  EnterActResultTask();
  setCreateProps();
  setPropResponsibleAndRegistration();
  setPropRegistration();
}

//Скрипт 4. Автоматичне визначення email контактної особи Замовника
function setContractorRPEmailOnCreate() {
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.tableAttributes;
    if (atr)
      EdocsApi.setAttributeValue({
        code: "ContractorRPEmail",
        value: EdocsApi.findElementByProperty("code", "ContactPersonEmail", atr)?.value,
        text: null,
      });
  }
}

function sendCommand(routeStage) {
  debugger;
  var command;
  var comment;
  if (routeStage.executionResult == "executed") {
    command = "CompleteTask";
  } else {
    command = "RejectTask";
    comment = routeStage.comment;
  }
  var signatures = EdocsApi.getSignaturesAllFiles();
  var DocCommandData = {
    extSysDocID: CurrentDocument.id,
    extSysDocVersion: CurrentDocument.version,
    command: command,
    legalEntityCode: EdocsApi.getAttributeValue("HomeOrgEDRPOU").value,
    userEmail: EdocsApi.getEmployeeDataByEmployeeID(CurrentUser.employeeId).email,
    userTitle: CurrentUser.fullName,
    comment: comment,
    signatures: signatures,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processDocCommand", // метод зовнішньої системи
    data: DocCommandData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: false, // виконувати завдання асинхронно
  };
}

function sendComment(comment) {
  debugger;
  var HomeOrgEDRPOU = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var HomeOrgName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!HomeOrgEDRPOU || !HomeOrgName) {
    return;
  }
  //var comment = comment;
  var methodData = {
    extSysDocId: CurrentDocument.id,
    ExtSysDocVersion: CurrentDocument.version,
    eventType: "CommentAdded",
    comment: comment,
    partyCode: HomeOrgEDRPOU,
    userTitle: CurrentUser.name,
    partyName: HomeOrgName,
    occuredAt: new Date(),
  };
  EdocsApi.runExternalFunction("ESIGN1", "integration/processEvent", methodData);
}

//Скрипт 6. Зміна властивостей атрибутів
function onTaskExecutedSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    ToDoPaymentOptionTask();
  }
}

function ToDoPaymentOptionTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("ToDoPaymentOption" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    EdocsApi.setControlProperties({ code: "PaymentOption", hidden: false, disabled: false, required: true });
  } else if (stateTask == "completed") {
    EdocsApi.setControlProperties({ code: "PaymentOption", hidden: false, disabled: true, required: true });
  } else {
    EdocsApi.setControlProperties({ code: "PaymentOption", hidden: true, disabled: false, required: false });
  }
}

//Скрипт 7. Зміна властивостей атрибутів
function ReceiptFundsTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("ReceiptFunds" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    EdocsApi.setControlProperties({ code: "StatusInvoice", hidden: false, disabled: false, required: true });
  } else if (stateTask == "completed") {
    EdocsApi.setControlProperties({ code: "StatusInvoice", hidden: false, disabled: true, required: true });
  } else {
    EdocsApi.setControlProperties({ code: "StatusInvoice", hidden: true, disabled: false, required: false });
  }
}

function onTaskExecuteReceiptFunds(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    validationIsValue("StatusInvoice", "Статус оплати Замовником");
  }
}

//Скрипт 8. Зміна властивостей атрибутів
function EnterActResultTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("EnterActResult" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    EdocsApi.setControlProperties({ code: "ActMeetingResult", hidden: false, disabled: false, required: true });
  } else if (stateTask == "completed") {
    EdocsApi.setControlProperties({ code: "ActMeetingResult", hidden: false, disabled: true, required: true });
  } else {
    EdocsApi.setControlProperties({ code: "ActMeetingResult", hidden: true, disabled: false, required: false });
  }
}

function onTaskExecuteEnterActResult(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    validationIsValue("ActMeetingResult", "Результат розгляду акту комісією");
  }
}

//Автоматичне визначення розрізу за кодом ЄДРПОУ
function setBranchAndSectionsOnCreate() {
  debugger;
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.tableAttributes;
    if (atr)
      switch (atr.find((x) => x.code == "LegalEntityCode" && x.row == "1")?.value) {
        case "40081195":
          EdocsApi.setAttributeValue({ code: "Branch", value: 82, text: null });
          EdocsApi.setAttributeValue({ code: "Sections", value: "40081195", text: null });
          break;

        case "40081216":
          EdocsApi.setAttributeValue({ code: "Branch", value: 86, text: null });
          EdocsApi.setAttributeValue({ code: "Sections", value: "40081216", text: null });
          break;

        case "40081237":
          EdocsApi.setAttributeValue({ code: "Branch", value: 252, text: null });
          EdocsApi.setAttributeValue({ code: "Sections", value: "40081237", text: null });
          break;
      }
  }
}

//Скрипт 2. Зміна властивостей при призначенні завдання
function onTaskExecutedAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    EdocsApi.setControlProperties({ code: "Subject", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "RegNumber", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "RegDate", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "Registraion", hidden: false, disabled: false, required: true });
  }
}

function SendOutDocTask(stateTask) {
  debugger;
  if (!stateTask) {
    stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;
  }
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    EdocsApi.setControlProperties({ code: "Subject", hidden: false, disabled: false, required: true });
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson", false);
  } else if (stateTask == "completed") {
    EdocsApi.setControlProperties({ code: "Subject", hidden: false, disabled: true, required: true });
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson");
    setPropertyDisabled("Branch");
  } else if (stateTask == "rejected") {
    if (EdocsApi.getCaseTaskDataByCode("AddEmployee" + EdocsApi.getAttributeValue("Sections").value)?.state == "completed") {
      EdocsApi.setControlProperties({ code: "Subject", hidden: true, disabled: true, required: false });
      EdocsApi.setControlProperties({ code: "TelephoneContactPerson", hidden: true, disabled: true, required: false });
      EdocsApi.setControlProperties({ code: "Registraion", hidden: true, disabled: true, required: false });
      EdocsApi.setControlProperties({ code: "RegNumber", hidden: true, disabled: true, required: false });
      EdocsApi.setControlProperties({ code: "RegDate", hidden: true, disabled: true, required: false });
    }
  } else {
    EdocsApi.setControlProperties({ code: "Subject", hidden: true, disabled: false, required: false });
    EdocsApi.setControlProperties({ code: "TelephoneContactPerson", hidden: true, disabled: false, required: false });
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    validationIsValue("RegNumber", "Реєстраційний номер");
    validationIsValue("RegDate", "Реєстраційна дата");
    validationIsValue("Registraion", "Реєстрація");
    sendCommand(routeStage);
    sendComment(`Ваше звернення прийняте та зареєстроване за № ${EdocsApi.getAttributeValue("RegNumber").value} від ${moment(new Date(EdocsApi.getAttributeValue("RegDate").value)).format("DD.MM.YYYY")}`);
  } else {
    SendOutDocTask("rejected");
  }
}

function onTaskExecuteMainTask(routeStage) {
  if (routeStage.executionResult == "rejected") {
    sendCommand(routeStage);
  }
}

//передача коментара в єСайн, додаткових функцій не потрібно
function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var orgShortName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = CurrentDocument.id;
  //EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}

//зміна властивостей при паралельних процесах
//Скрипт 1. Зміна властивостей атрибутів полів карточки
function onTaskPickUpedAddEmployee() {
  setPropResponsibleAndRegistration();
}

function onTaskPickUpedInformHead() {
  setPropResponsibleAndRegistration();
}

function setPropResponsibleAndRegistration() {
  debugger;
  var CaseTaskAddEmployee = EdocsApi.getCaseTaskDataByCode("AddEmployee" + EdocsApi.getAttributeValue("Sections").value);
  var CaseTaskInformHead = EdocsApi.getCaseTaskDataByCode("InformHead" + EdocsApi.getAttributeValue("Sections").value);

  if (
    //етап AddEmployee взято в роботу, поточний користувач == виконавець завдання AddEmployee
    (CaseTaskAddEmployee.state == "inProgress" && CurrentUser.employeeId == CaseTaskAddEmployee.executorId) ||
    (CaseTaskAddEmployee.state == "delegated" && CurrentUser.employeeId == CaseTaskAddEmployee.executorId)
  ) {
    EdocsApi.setControlProperties({ code: "Responsible", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "Registraion", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "RegDate", hidden: false, disabled: false, required: true });
    EdocsApi.setControlProperties({ code: "RegNumber", hidden: false, disabled: false, required: true });
  } else if (
    //етап InformHead взято в роботу, поточний користувач == виконавець завдання InformHead
    (CaseTaskInformHead.state == "inProgress" && CurrentUser.employeeId == CaseTaskInformHead.executorId) ||
    (CaseTaskInformHead.state == "delegated" && CurrentUser.employeeId == CaseTaskInformHead.executorId)
  ) {
    EdocsApi.setControlProperties({ code: "Responsible", hidden: false, disabled: true, required: false });
    EdocsApi.setControlProperties({ code: "Registraion", hidden: false, disabled: true, required: false });
    EdocsApi.setControlProperties({ code: "RegDate", hidden: false, disabled: true, required: false });
    EdocsApi.setControlProperties({ code: "RegNumber", hidden: false, disabled: true, required: false });
  } else if (CaseTaskAddEmployee.state == "completed") {
    EdocsApi.setControlProperties({ code: "Responsible", hidden: false, disabled: true, required: true });
    EdocsApi.setControlProperties({ code: "Registraion", hidden: false, disabled: true, required: true });
    EdocsApi.setControlProperties({ code: "RegDate", hidden: false, disabled: true, required: true });
    EdocsApi.setControlProperties({ code: "RegNumber", hidden: false, disabled: true, required: true });
  } else {
    setPropertyHidden("Responsible", false);
    setPropertyRequired("Responsible");
    //setPropertyDisabled("Responsible");
    setPropertyHidden("RegDate", false);
    setPropertyRequired("RegDate");
    setPropertyHidden("Registraion", false);
    setPropertyRequired("Registraion");
    setPropertyHidden("RegNumber", false);
    setPropertyRequired("RegNumber");
  }
}

function onTaskExecuteAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    validationIsValue("Responsible", "Відповідальний працівник");
    validationIsValue("RegDate", "Реєстраційна дата");
    validationIsValue("RegNumber", "Реєстраційний номер");
    validationIsValue("Registraion", "Реєстрація");
  }
}

function setPropRegistration() {
  debugger;
  if (EdocsApi.getCaseTaskDataByCode("AddEmployee" + EdocsApi.getAttributeValue("Sections").value)?.state == "completed" && EdocsApi.getCaseTaskDataByCode("MainTask")?.state == "rejected") {
    EdocsApi.setControlProperties({ code: "Registraion", hidden: true, disabled: true, required: false });
    EdocsApi.setControlProperties({ code: "RegDate", hidden: true, disabled: true, required: false });
    EdocsApi.setControlProperties({ code: "RegNumber", hidden: true, disabled: true, required: false });
  }
}
