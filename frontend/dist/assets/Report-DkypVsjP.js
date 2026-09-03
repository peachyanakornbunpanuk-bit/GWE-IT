import{d as S,b as q,R as A,al as E,o as $,f as R,g as B,w as s,h as d,i as e,s as x,t as g,x as f,q as b,aF as m,m as l,p as I}from"./index-BGUjSBXR.js";import{u as i,w as v}from"./xlsx-CKN5doRT.js";import{h as y}from"./html2pdf-DV_EFeKC.js";const j={class:"row q-col-gutter-lg"},F={class:"col-12 col-md-6"},P={class:"text-h6 text-dark text-weight-bold flex items-center"},M={class:"col-12 col-md-6"},Q={class:"text-h6 text-dark text-weight-bold flex items-center"},z={class:"col-12 col-md-12"},H={class:"text-h6 text-dark text-weight-bold flex items-center"},L=S({__name:"Report",setup(T){const n=q(),p=A(),c=E();$(()=>{p.fetchAssets(),c.fetchAllTransactions()});const _=()=>{const o=i.json_to_sheet(p.assets),t=i.book_new();i.book_append_sheet(t,o,"Assets"),v(t,"IAMS_Asset_Report.xlsx")},k=()=>{const o=document.createElement("div");o.innerHTML=`
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #1976D2; padding-bottom: 10px;">IAMS Asset Inventory Report</h2>
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 14px;">
        <thead style="display: table-header-group;">
          <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
            <th style="padding: 12px; border: 1px solid #cfd8dc;">ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Name</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Category</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Status</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Holder</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Value (THB)</th>
          </tr>
        </thead>
        <tbody>
          ${p.assets.map(t=>`
            <tr style="page-break-inside: avoid; page-break-after: auto;">
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.name}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.category}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.status}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.holder}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.value}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `,y().from(o).set({margin:[15,10],filename:"IAMS_Asset_Report.pdf",pagebreak:{mode:["css","legacy"],avoid:"tr"},image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save().then(()=>{n.loading.hide()})},w=()=>{const o=i.json_to_sheet(c.borrows),t=i.book_new();i.book_append_sheet(t,o,"Borrows"),v(t,"IAMS_Borrow_Report.xlsx")},C=()=>{const o=document.createElement("div");o.innerHTML=`
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #C10015; padding-bottom: 10px;">IAMS Borrow History Report</h2>
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 14px;">
        <thead style="display: table-header-group;">
          <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
            <th style="padding: 12px; border: 1px solid #cfd8dc;">ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Asset ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Employee ID</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Borrow Date</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Return Date</th>
            <th style="padding: 12px; border: 1px solid #cfd8dc;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${c.borrows.map(t=>`
            <tr style="page-break-inside: avoid; page-break-after: auto;">
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.asset_id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.employee_id}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.borrow_date}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.return_date||"-"}</td>
              <td style="padding: 10px; border: 1px solid #cfd8dc;">${t.status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `,y().from(o).set({margin:[15,10],filename:"IAMS_Borrow_Report.pdf",pagebreak:{mode:["css","legacy"],avoid:"tr"},image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save().then(()=>{n.loading.hide()})},D=()=>{n.loading.show({message:"Generating PDF..."});const o=p.assets.reduce((a,r)=>(a[r.category]||(a[r.category]=[]),a[r.category].push(r),a),{});let t=`
    <div style="padding: 20px; font-family: sans-serif;">
      <h2 style="color: #263238; border-bottom: 2px solid #21BA45; padding-bottom: 10px;"> Stock Checklist</h2>
  `;for(const[a,r]of Object.entries(o))t+=`
      <div class="category-block" style="page-break-inside: avoid; margin-bottom: 40px;">
        <h3 style="color: #37474f; margin-top: 10px; margin-bottom: 15px;">📂 ${a}</h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px;">
          <thead style="display: table-header-group;">
            <tr style="background-color: #f5f7fa; color: #37474f; text-align: left; page-break-inside: avoid; page-break-after: auto;">
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 15%">ID</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 35%">Name</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 25%">Quantity</th>
              <th style="padding: 12px; border: 1px solid #cfd8dc; width: 25%">Notes / Condition</th>
            </tr>
          </thead>
          <tbody>
            ${r.map(u=>`
              <tr style="page-break-inside: avoid; page-break-after: auto;">
                <td style="padding: 10px; border: 1px solid #cfd8dc;">${u.id}</td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;">${u.name}</td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;"></td>
                <td style="padding: 10px; border: 1px solid #cfd8dc;"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;t+="</div>";const h=document.createElement("div");h.innerHTML=t,y().from(h).set({margin:[15,10],filename:"GWE_Stock_Checklist.pdf",pagebreak:{mode:["css","legacy"],avoid:[".category-block","tr"]},image:{type:"jpeg",quality:1},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).save().then(()=>{n.loading.hide()})};return(o,t)=>(R(),B(I,{padding:"",class:"q-pa-lg fade-in"},{default:s(()=>[t[6]||(t[6]=d("div",{class:"row justify-between items-center q-mb-lg"},[d("div",null,[d("div",{class:"text-h4 text-weight-bold text-dark"},"Reports & Exports"),d("div",{class:"text-subtitle1 text-grey-6"},"Download your data in Excel and PDF formats")])],-1)),d("div",j,[d("div",F,[e(x,{class:"clean-card"},{default:s(()=>[e(g,null,{default:s(()=>[d("div",P,[e(f,{name:"inventory",class:"q-mr-sm text-primary",size:"24px"}),t[0]||(t[0]=b(" Asset Inventory Report ",-1))]),t[1]||(t[1]=d("p",{class:"text-grey-7 q-mt-sm"},"Export a complete list of all assets, their categories, values, and current status.",-1))]),_:1}),e(m,{align:"right",class:"q-pa-md pt-none"},{default:s(()=>[e(l,{color:"positive",icon:"table_view",label:"Export Excel",unelevated:"",onClick:_,style:{"border-radius":"8px","font-weight":"600"}}),e(l,{color:"negative",icon:"picture_as_pdf",label:"Export PDF",unelevated:"",onClick:k,class:"q-ml-sm",style:{"border-radius":"8px","font-weight":"600"}})]),_:1})]),_:1})]),d("div",M,[e(x,{class:"clean-card"},{default:s(()=>[e(g,null,{default:s(()=>[d("div",Q,[e(f,{name:"swap_horiz",class:"q-mr-sm text-primary",size:"24px"}),t[2]||(t[2]=b(" Borrow History Report ",-1))]),t[3]||(t[3]=d("p",{class:"text-grey-7 q-mt-sm"},"Export a comprehensive log of all hardware checkouts and returns.",-1))]),_:1}),e(m,{align:"right",class:"q-pa-md pt-none"},{default:s(()=>[e(l,{color:"positive",icon:"table_view",label:"Export Excel",unelevated:"",onClick:w,style:{"border-radius":"8px","font-weight":"600"}}),e(l,{color:"negative",icon:"picture_as_pdf",label:"Export PDF",unelevated:"",onClick:C,class:"q-ml-sm",style:{"border-radius":"8px","font-weight":"600"}})]),_:1})]),_:1})]),d("div",z,[e(x,{class:"clean-card"},{default:s(()=>[e(g,null,{default:s(()=>[d("div",H,[e(f,{name:"fact_check",class:"q-mr-sm text-primary",size:"24px"}),t[4]||(t[4]=b(" Stock Checklist ",-1))]),t[5]||(t[5]=d("p",{class:"text-grey-7 q-mt-sm"},"Export a printable checklist grouped by category for warehouse auditing, including blank spaces for count and condition notes.",-1))]),_:1}),e(m,{align:"right",class:"q-pa-md pt-none"},{default:s(()=>[e(l,{color:"negative",icon:"picture_as_pdf",label:"Export Checklist PDF",unelevated:"",onClick:D,style:{"border-radius":"8px","font-weight":"600"}})]),_:1})]),_:1})])])]),_:1}))}});export{L as default};
