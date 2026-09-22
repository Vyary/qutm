function ConfirmModal(props: any) {
  return (
    <div
      class="absolute left-1/2 -translate-x-1/2 card w-96 card-sm shadow-sm bg-base-300 z-10"
      classList={props.classList}
    >
      <div class="card-body">
        <h2 class="card-title">Delete {props.text}</h2>
        <p>Are you sure you want to delete this {props.text.toLowerCase()}?</p>
        <div class="justify-end card-actions">{props.children}</div>
      </div>
    </div>
  );
}

export default ConfirmModal;
